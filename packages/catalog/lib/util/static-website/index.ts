// stolen from https://github.com/CaerusKaru/waltersco-shs
import { Construct } from '@aws-cdk/core';
import * as certificatemanager from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as s3 from '@aws-cdk/aws-s3';

/**
 * Properties to configure the static website construct.
 */
export interface StaticWebsiteProps {
  /**
   * The bucket that contains the static website contents.
   */
  readonly bucket: s3.IBucket;

  /**
   * The hosted zone for the static website, e.g. example.com
   * @default - required with domainName
   */
  readonly hostedZone?: route53.IHostedZone;

  /**
   * The domain name for the static website, e.g. test.example.com
   * @default - required with hostedZone
   */
  readonly domainName?: string;

  /**
   * The default document file name, will be appended to any URLs that do not
   * end with a path component with one of the extension suffixes.
   * @default index.html
   */
  readonly indexFile?: string;

  /**
   * A list of file extensions that are considered when appending the index file
   * name to a url.
   * 
   * @default 
   */
  readonly fileExtensions?: string[];

  /**
   * Whether to add single-page application (SPA) functionality to the CloudFront distribution
   * @default false
   */
  readonly spa?: boolean;

  /**
   * Source configurations to set for the CloudFront distribution.
   * @default - A default source configuration is always added
   */
  readonly sourceConfigs?: cloudfront.SourceConfiguration[];

  /**
   * The path within the S3 bucket to use for the default (catch all) origin.
   * @default /
   */
  readonly defaultOriginPath?: string;

  /**
   * Error configurations to set for the CloudFront distribution.
   * @default none, unless spa also set to true
   */
  readonly errorConfigs?: cloudfront.CfnDistribution.CustomErrorResponseProperty[];

  /**
   * Default behaviors to apply to the CloudFront distribution.
   * @default - Compression on; GET, HEAD, and OPTIONS allowed methods
   */
  readonly behaviors?: cloudfront.Behavior[];

  /**
   * The price class for the CLoudFront distribution.
   * @default price class 100
   * @see https://aws.amazon.com/cloudfront/pricing/
   */
  readonly priceClass?: cloudfront.PriceClass;
}

/**
 * Exposes a status reporting API based on result of a periodic (1 min) HTTP
 * pings. Uses S3, CloudFront, and Route53 to store and route to the website,
 * and creates an ACM certificate.
 */
export class StaticWebsite extends Construct {
  public static readonly DEFAULT_FILE_EXTENSIONS = [ '.html', '.htm', '.md', '.css', '.js', '.aspx', '.php', '.dhtml', '.htmls', '.json', '.jsp', '.jspx', '.php3', '.pdf', '.png', '.gif', '.tiff', '.zip', '.gz', '.wsdl', '.tiff', '.bmp', '.svg', '.jpg', '.jpeg', '.mkv', '.avi', '.txt' ];
  public readonly distribution: cloudfront.CloudFrontWebDistribution;

  constructor(scope: Construct, name: string, props: StaticWebsiteProps) {
    super(scope, name);

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
    const s3UserId = originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId;

    const bucket = props.bucket;

    bucket.grantRead(new iam.CanonicalUserPrincipal(s3UserId));
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:ListBucket'],
        principals: [new iam.CanonicalUserPrincipal(s3UserId)],
        resources: [bucket.bucketArn]
      })
    );
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        principals: [new iam.AccountRootPrincipal()],
        resources: [bucket.arnForObjects('*')]
      })
    );

    const sourceConfigs: cloudfront.SourceConfiguration[] = (props.sourceConfigs || [])
      .map((config: cloudfront.SourceConfiguration) => {
        const fixedConfig = {...config};
        if (!fixedConfig.s3OriginSource && !fixedConfig.customOriginSource) {
          fixedConfig.s3OriginSource = {            
            originAccessIdentity,
            s3BucketSource: bucket,
          };
          fixedConfig.originPath = config.originPath;
        }
        return fixedConfig as cloudfront.SourceConfiguration;
      });

    sourceConfigs.push({
      s3OriginSource: {
        originAccessIdentity: originAccessIdentity,
        s3BucketSource: bucket
      },
      originPath: props.defaultOriginPath,
      behaviors: props.behaviors ? props.behaviors : [
        {
          isDefaultBehavior: true,
          allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          compress: true,
        }
      ],
    });

    const indexFile = props.indexFile || 'index.html';
    if (indexFile.startsWith('/')) {
      throw new Error(`Default file cannot start with a /. Got ${indexFile}`);
    }

    const errorConfigs: cloudfront.CfnDistribution.CustomErrorResponseProperty[] = [];
    if (props.errorConfigs) {
      errorConfigs.push(...props.errorConfigs);
    }

    if (props.spa) {
      errorConfigs.push({
        errorCode: 404,
        responseCode: 200,
        responsePagePath: `/${indexFile}`,
      });
    }

    const cloudFrontProps: cloudfront.CloudFrontWebDistributionProps = {
      defaultRootObject: indexFile,
      enableIpV6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: props.priceClass || cloudfront.PriceClass.PRICE_CLASS_100,
      originConfigs: sourceConfigs,
      errorConfigurations: errorConfigs,
    };

    if (props.hostedZone && props.domainName) {
      const certificate = new certificatemanager.DnsValidatedCertificate(this, 'Certificate', {
        domainName: props.domainName,
        hostedZone: props.hostedZone,
        region: 'us-east-1',
      });

      this.distribution = new cloudfront.CloudFrontWebDistribution(this, 'SWCFDistribution', {
        ...cloudFrontProps,
        aliasConfiguration: {
          acmCertRef: certificate.certificateArn,
          names: [props.domainName]
        },
      });

      new route53.ARecord(this, 'Record', {
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        zone: props.hostedZone
      });

      new route53.AaaaRecord(this, 'AAAARecord', {
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        zone: props.hostedZone
      });
    } else {
      this.distribution = new cloudfront.CloudFrontWebDistribution(this, 'SWCFDistribution', cloudFrontProps);
    }
  }
}
