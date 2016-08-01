import { Dictionary } from '../lang';

export function render(template: string, data: Dictionary<any>): string {
    return template.replace(/\{([$\w.-]+)\}/g, (text: string, expression: string) => {
        let keys = expression.split('.');

        let node: any = data;

        for (let key of keys) {
            node = node[key];

            if (node === undefined) {
                return text;
            }
        }

        return node;
    });
}
