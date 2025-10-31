import { ListMemory } from "../memory/ListMemory";
import { RawMemory } from "../memory/RawMemory";
import { MemoryNotFoundError, ValidationError } from "../utils/errors";
import { JsonStorage } from "./JsonStorage";

const NAMEPATH_FLAG_RE = /<:(.*?):>/g;

function parseNamePath(namePath: string) : { names: string[]; flags: string[] } {
    namePath = namePath.trim();
    const names: string[] = [];
    const flags: string[] = [];
    const match = namePath.matchAll(NAMEPATH_FLAG_RE);
    let idx = 0;
    for (const m of match || []) {
        names.push(namePath.substring(idx, m.index));
        idx = m.index + m[0].length;
        flags.push(m[1]);
    }
    names.push(namePath.substring(idx));
    return {names, flags};
}

export const NamePathHelper = {
    GetAndUpdate: (storage: JsonStorage, namePath: string): [() => RawMemory, (v: RawMemory) => Promise<void>] => {
        if (storage.hasMemory(namePath)) {
            return [
                () => storage.getMemory(namePath) as RawMemory,
                async (v: RawMemory) => await storage.updateMemory(v)
            ];
        } else {
            let index = -1;
            const parsed = parseNamePath(namePath);
            if (parsed.flags.length <= 1) {
                throw new ValidationError('namePath', 'Invalid namePath format');
            }
            const parent = storage.getMemory(parsed.names[0]);
            if (!parent) {
                throw new MemoryNotFoundError('Parent memory not found');
            }
            if (parent.type === 'list') {
                if (parsed.flags[0] !== '') {
                    switch (parsed.flags[0]) {
                        case 'FRONT':
                            index = 0;
                            break;
                        case 'TOP':
                        case 'BACK':
                            index = (parent as ListMemory).length - 1;
                            break;
                        default:
                            index = parseInt(`${parsed.flags[0]}`);
                    }
                } else {
                    const searched = (parent as ListMemory).search(parsed.names[1]);
                    if (searched.length > 0) {
                        index = searched[0].index;
                    } else {
                        throw new MemoryNotFoundError('Memory not found');
                    }
                }

                return [
                    () => (parent as ListMemory).getAt(index) as RawMemory,
                    async (v: RawMemory) => {
                        // reference object doesn't need to update parent
                        storage.forceSave();
                    }
                ]
            } else if (parent.type === 'graph') {
                throw new Error('Not implemented');
            }
        }
        throw new Error('Not implemented');
    }
}