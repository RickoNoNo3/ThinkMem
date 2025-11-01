import { ListMemory } from "../memory/ListMemory";
import { RawMemory } from "../memory/RawMemory";
import { InvalidOperationError, MemoryNotFoundError, ValidationError } from "../utils/errors";
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
                () => {
                    const m = storage.getMemory(namePath) as RawMemory;
                    if (m.type !== 'raw') {
                        throw new ValidationError('namePath', `Memory ${namePath} is not of type raw`);
                    }
                    return m;
                },
                async (v: RawMemory) => await storage.updateMemory(v)
            ];
        } else {
            let index = -1;
            const parsed = parseNamePath(namePath);
            if (parsed.flags.length < 1) {
                throw new ValidationError('namePath', 'Invalid namePath format');
            }
            let parent = storage.getMemory(parsed.names[0]);
            if (!parent) {
                throw new MemoryNotFoundError(parsed.names[0]);
            }
            if (parent.type === 'list') {
                parent = ListMemory.fromJSON(parent as ListMemory);
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
                    // Use exact name matching only
                    const memory = (parent as ListMemory).getByName(parsed.names[1]);
                    if (memory) {
                        // Found by exact name match
                        const memoryList = (parent as ListMemory).list;
                        index = memoryList.findIndex(m => m.name === memory.name);
                    } else {
                        throw new MemoryNotFoundError(parsed.names[1]);
                    }
                }

                return [
                    () => (parent as ListMemory).getAt(index) as RawMemory,
                    async (v: RawMemory) => {
                        (parent as ListMemory).setAt(index, v);
                        await storage.updateMemory(parent as RawMemory);
                    }
                ]
            } else if (parent.type === 'graph') {
                throw new Error('Not implemented');
            } else {
                throw new InvalidOperationError('parseNamePath', `Memory ${parsed.names[0]} is not a container type`);
            }
        }
        throw new Error('Not implemented');
    }
}