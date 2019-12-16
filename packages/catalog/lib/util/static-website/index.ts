// stolen from https://github.com/CaerusKaru/waltersco-shs

// import iam = require('@aws-cdk/aws-iam');
import {DnsValidatedCertificate} from '@aws-cdk/aws-certificatemanager';
// import cloudfront = require('@aws-cdk/aws-cloudfront');
// import lambda = require('@aws-cdk/aws-lambda');
import {
  Behavior,
  CfnCloudFrontOriginAccessIdentity,
  CfnDistribution,
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  HttpVersion,
  PriceClass,
  SourceConfiguration,
  ViewerProtocolPolicy
} from '@aws-cdk/aws-cloudfront';
import {AccountRootPrincipal, CanonicalUserPrincipal, PolicyStatement} from '@aws-cdk/aws-iam';
import {AaaaRecord, ARecord, IHostedZone, RecordTarget} from '@aws-cdk/aws-route53';
import {CloudFrontTarget} from '@aws-cdk/aws-route53-targets';
import {IBucket} from '@aws-cdk/aws-s3';
import {Construct} from '@aws-cdk/core';
// import { fingerprint } from '@aws-cdk/assets/lib/fs/fingerprint';


/**
 * Properties to configure the static website construct.
 */
export interface StaticWebsiteProps {
  /**
   * The bucket that contains the static website contents.
   */
  readonly bucket: IBucket;

  /**
   * The hosted zone for the static website, e.g. example.com
   * @default - required with domainName
   */
  readonly hostedZone?: IHostedZone;

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
  readonly sourceConfigs?: SourceConfiguration[];

  /**
   * Error configurations to set for the CloudFront distribution.
   * @default none, unless spa also set to true
   */
  readonly errorConfigs?: CfnDistribution.CustomErrorResponseProperty[];

  /**
   * Default behaviors to apply to the CloudFront distribution.
   * @default - Compression on; GET, HEAD, and OPTIONS allowed methods
   */
  readonly behaviors?: Behavior[];

  /**
   * The price class for the CLoudFront distribution.
   * @default price class 100
   * @see https://aws.amazon.com/cloudfront/pricing/
   */
  readonly priceClass?: PriceClass;
}

/**
 * Exposes a status reporting API based on result of a periodic (1 min) HTTP
 * pings. Uses S3, CloudFront, and Route53 to store and route to the website,
 * and creates an ACM certificate.
 */
export class StaticWebsite extends Construct {
  public static readonly DEFAULT_FILE_EXTENSIONS = [ '.html', '.htm', '.md', '.css', '.js', '.aspx', '.php', '.dhtml', '.htmls', '.json', '.jsp', '.jspx', '.php3', '.pdf', '.png', '.gif', '.tiff', '.zip', '.gz', '.wsdl', '.tiff', '.bmp', '.svg', '.jpg', '.jpeg', '.mkv', '.avi', '.txt' ];
  public readonly distribution: CloudFrontWebDistribution;

  constructor(scope: Construct, name: string, props: StaticWebsiteProps) {
    super(scope, name);

    const originAccessIdentity = new CfnCloudFrontOriginAccessIdentity(this, 'OAI', {
      cloudFrontOriginAccessIdentityConfig: {
        comment: 'OAI'
      }
    });
    const s3UserId = originAccessIdentity.attrS3CanonicalUserId;

    const bucket = props.bucket;

    bucket.grantRead(new CanonicalUserPrincipal(s3UserId));
    bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:ListBucket'],
        principals: [new CanonicalUserPrincipal(s3UserId)],
        resources: [bucket.bucketArn]
      })
    );
    bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        principals: [new AccountRootPrincipal()],
        resources: [bucket.arnForObjects('*')]
      })
    );

    // const urlRewriterDir = __dirname + '/url-rewriter';
    // const urlRewriter = new lambda.Function(this, 'UrlRewriter', {
    //   runtime: lambda.Runtime.NODEJS_8_10,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset(urlRewriterDir)
    // });

    // if (!(urlRewriter.role instanceof iam.Role)) {
    //   throw new Error('assertion failed');
    // }

    // urlRewriter.role.assumeRolePolicy?.addStatements(new PolicyStatement({
    //   actions: [ 'sts:AssumeRole' ],
    //   principals: [ new iam.ServicePrincipal('edgelambda.amazonaws.com') ]
    // }));

    // const urlRewriterHash = fingerprint(urlRewriterDir);
    // const urlRewriterVersion = urlRewriter.addVersion(urlRewriterHash);

    const sourceConfigs: SourceConfiguration[] = (props.sourceConfigs || [])
      .map((config: SourceConfiguration) => {
        const fixedConfig = {...config};
        if (!fixedConfig.s3OriginSource && !fixedConfig.customOriginSource) {
          fixedConfig.s3OriginSource = {
            originAccessIdentityId: originAccessIdentity.ref,
            s3BucketSource: bucket,
          };
          fixedConfig.originPath = config.originPath;
        }
        return fixedConfig as SourceConfiguration;
      });

    sourceConfigs.push({
      s3OriginSource: {
        originAccessIdentityId: originAccessIdentity.ref,
        s3BucketSource: bucket
      },
      behaviors: props.behaviors ? props.behaviors : [
        {
          isDefaultBehavior: true,
          allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          compress: true,
          // lambdaFunctionAssociations: [
          //   {
          //     eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          //     lambdaFunction: urlRewriterVersion
          //   }
          // ]
        }
      ],
    });

    const indexFile = props.indexFile || 'index.html';
    if (indexFile.startsWith('/')) {
      throw new Error(`Default file cannot start with a /. Got ${indexFile}`);
    }

    const errorConfigs: CfnDistribution.CustomErrorResponseProperty[] = [];
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

    const cloudFrontProps: CloudFrontWebDistributionProps = {
      defaultRootObject: indexFile,
      enableIpV6: true,
      httpVersion: HttpVersion.HTTP2,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: props.priceClass || PriceClass.PRICE_CLASS_100,
      originConfigs: sourceConfigs,
      errorConfigurations: errorConfigs,
    };

    if (props.hostedZone && props.domainName) {
      const certificate = new DnsValidatedCertificate(this, 'Certificate', {
        domainName: props.domainName,
        hostedZone: props.hostedZone,
        region: 'us-east-1',
      });

      this.distribution = new CloudFrontWebDistribution(this, 'SWCFDistribution', {
        ...cloudFrontProps,
        aliasConfiguration: {
          acmCertRef: certificate.certificateArn,
          names: [props.domainName]
        },
      });

      new ARecord(this, 'Record', {
        recordName: props.domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        zone: props.hostedZone
      });

      new AaaaRecord(this, 'AAAARecord', {
        recordName: props.domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        zone: props.hostedZone
      });
    } else {
      this.distribution = new CloudFrontWebDistribution(this, 'SWCFDistribution', cloudFrontProps);
    }
  }
}
