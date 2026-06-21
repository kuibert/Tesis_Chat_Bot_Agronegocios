import { parseOfficeAsync } from 'officeparser';
import fs from 'fs';

parseOfficeAsync('C:/Users/Moris/OneDrive/Documentos/Tesis/Tesis agronegocios (1).docx').then(text => {
  fs.writeFileSync('C:/Users/Moris/OneDrive/Documentos/Tesis/tesis_extracted.txt', text);
  console.log("Extracted");
}).catch(console.error);
