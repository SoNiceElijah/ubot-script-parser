
///////////////////////////////////////
///           String reader         ///
///////////////////////////////////////

function countSpaces(str) {
    const res = [];
    const lines = str.split('\n');
    for(const line of lines) {
        let num = 0;
        let pad = line.length - 1;
        while(num < line.length && line[num] === ' ') num++;
        while(pad >= 0 && line[pad] === ' ') pad--;
        res.push({ shift : num, line, pad : line.length - 1 - pad });
    }

    return res;
}

function makeFlatten(lines) {
    if(!lines.length) return "";
    let lvl = lines[0].shift;
    let res = "";

    lines.push({ shift : lvl, line : '', pad : 0 });

    let num = 0;
    let map = [];

    let acc = 0;
    let comment = false;

    const stack = [lvl];
    for(const line of lines) {

        ++num;
        let trimmed = line.line.trim();
        if(trimmed === '' && num !== lines.length) {
            acc += line.line.length + 1;
            continue;
        }

        if(trimmed.startsWith('#')) {
            acc += line.line.length + 1;
            continue;
        }
            
        const idx = trimmed.indexOf('#');
        if(idx > 0) {
            const len = trimmed.length;
            trimmed = trimmed.substring(0,idx);
            line.pad = line.pad + len - idx;
        }

        const midx = trimmed.indexOf('/*');
        if(midx > 0) {
            comment = true;
            trimmed = trimmed.substring(0,midx);
        }

        const eidx = trimmed.indexOf('*/');
        if(eidx > 0 && comment) {
            trimmed = trimmed.substring(eidx);
            comment = false;
        }

        if(comment) {
            acc += line.line.length + 1;
            continue;
        }

        // console.log(line.shift + trimmed.length + line.pad, line.line.length);
        
        if(line.shift === lvl) {
            //FIXME: useless
            if(res === "") { 
                res = trimmed;
                for(let i = 0; i < trimmed.length; ++i) {
                    map.push({ line : num, col : line.shift + i + 1, pos : acc + line.shift + i })
                }
                acc += line.line.length + 1;
                continue;
            }
            res += `;${trimmed}`;

            map.push({ line : num, col : line.shift + 1, pos : acc + line.shift });
            for(let i = 0; i < trimmed.length; ++i) {
                map.push({ line : num, col : line.shift + i + 1, pos : acc + line.shift + i })
            }
        } 
        if(line.shift < lvl) {
            while(stack.length && stack.pop() !== line.shift) {
                res += `}`;

                map.push({ line : num, col : line.shift + 1, pos : acc + line.shift });
            }
            res += `;${trimmed}`;
            stack.push(line.shift);

            map.push({ line : num, col : line.shift, pos : acc + line.shift });
            for(let i = 0; i < trimmed.length; ++i) {
                map.push({ line : num, col : line.shift + i + 1, pos : acc + line.shift + i })
            }
        }    
        if(line.shift > lvl)  {
            res += `{${trimmed}`;
            stack.push(line.shift);
            
            map.push({ line : num, col : line.shift + 1, pos : acc + line.shift });

            for(let i = 0; i < trimmed.length; ++i) {
                map.push({ line : num, col : line.shift + i + 1, pos : acc + line.shift + i })
            }
        }

        acc += line.line.length + 1;
        lvl = line.shift;
    }

    acc -= 2;
    map.push({line : num, col : 0, pos : acc - 1 });
    return { res, map };
}

class ReaderFactory {
    constructor(str, prepoc) {
        if(!prepoc) prepoc = defaultPreProc;
        const { res, map } = prepoc(str);
        this.source = str;
        this.str = res;
        this.map = map;
    }
    getFromSourceLine(pos) {
        let left = 0;
        let res = "";
        while(pos - left >= 0 && this.source[pos - left] !== '\n')
            ++left;
        const start = pos - left;
        let i = 1;
        while(start + i < this.source.length && this.source[start + i] !== '\n') {
            res += this.source[start + i];
            ++i;
        }

        return { res, left };
    }
    getFromSource(from, len = 1) {
        from = Math.max(0,from);
        let res = "";
        for(let i = 0; i < len; ++i) {
            if(from + i === this.source.length)
                break;
            res += this.source[from + i];
        }
        return res;
    }
    create() {
        return new Reader(this, 0);
    }
}

class Reader {
    constructor(base, pos) {
        this.base = base;
        this.pos = pos;
    }
    check(len = 1) {
        let res = "";
        for(let i = 0; i < len; ++i)
            res += this.base.str[this.pos + i];
        return res;
    }
    seek(len) {
        let res = "";
        for(let i = 0; i < len && this.pos < this.base.str.length; ++i)
        {
            res += this.base.str[this.pos];
            this.pos += 1;
        }
        return res;
    }
    trimSpaces() {
        while(this.base.str[this.pos] === ' ') {
            this.pos += 1;
        }
    }
    eof() {
        return this.pos === this.base.str.length;
    }
    size() {
        this.base.str.length;
    }
    match(regexp) {
        const res = this.base.str.substring(this.pos).match(regexp);
        if(!res)
            return false;
        this.pos += res[0].length;
        return res[0];
    }
    fork() {
        return new Reader(this.base, this.pos);
    }
}

function defaultPreProc(str) {
    const map = [];
    for(let i = 0; i < str.length; ++i) {
        map.push({ pos : i });
    };
    return { res : str, map };
}

module.exports = { defaultPreProc, makeFlatten, countSpaces, Reader, ReaderFactory };
