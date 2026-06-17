const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('    return parsed.map((item: any) => ({', '    return parsed.map((item: any) => ({');
s = s.replace('  } catch {\n    return [];\n  }\n}', '  } catch (e: any) {\n    throw e;\n  }\n}');
fs.writeFileSync(p, s, 'utf-8');
console.log('throw-on-error');
