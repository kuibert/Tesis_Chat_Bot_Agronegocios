import * as fs from 'fs';

const text = fs.readFileSync('C:/Users/Moris/OneDrive/Documentos/Tesis/tesis.txt', 'utf-8');
const plainText = text.replace(/<[^>]+>/g, '\n');

// Buscar Capitulo 3
const lines = plainText.split('\n').filter(l => l.trim().length > 0);
let startIdx = -1;
let endIdx = -1;

for(let i=0; i<lines.length; i++) {
  if (lines[i].toUpperCase().includes('CAPÍTULO III') || lines[i].toUpperCase().includes('CAPITULO III') || lines[i].toUpperCase().includes('CAPITULO 3') || lines[i].toUpperCase().includes('CAPÍTULO 3')) {
    if (startIdx === -1) {
      startIdx = i;
    }
  }
  if (startIdx !== -1 && (lines[i].toUpperCase().includes('CAPÍTULO IV') || lines[i].toUpperCase().includes('CAPITULO IV'))) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1) {
    if (endIdx === -1) endIdx = lines.length;
    fs.writeFileSync('C:/Users/Moris/OneDrive/Documentos/Tesis/cap3.txt', lines.slice(startIdx, endIdx).join('\n'));
    console.log(`Capitulo 3 extraido. Lineas: ${endIdx - startIdx}`);
} else {
    console.log("No se encontro Capitulo 3");
    fs.writeFileSync('C:/Users/Moris/OneDrive/Documentos/Tesis/cap3.txt', lines.slice(0, 1000).join('\n'));
}
