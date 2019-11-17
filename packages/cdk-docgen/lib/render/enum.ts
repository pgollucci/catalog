import jsiiReflect = require('jsii-reflect');
import { stability } from './util';
import { Document } from '../document';

export function enumPage(enumType: jsiiReflect.EnumType, id: string): Document {
  const title = `enum ${enumType.name}`;

  const markdown = [
    `# ${title} ${stability(enumType)}`,
    '',
    enumType.docs.toString(),
    '',
    'Name | Description',
    '-----|-----',
    ...enumType.members.map(m => renderMemberRow(enumType, m)),
  ].join('\n');

  return new Document(id, markdown, { title: enumType.name });
}

function renderMemberRow(enumType: jsiiReflect.EnumType, member: jsiiReflect.EnumMember) {
  return [
    `**${member.name}** ${stability(enumType)}`,
    member.docs.summary,
  ].join('|');
}
