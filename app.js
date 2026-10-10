pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
const $ = id => document.getElementById(id);
// theme
(function(){
  let t = 'dark'; try { t = localStorage.getItem('theme') || 'dark'; } catch(e){}
  const set = v => { document.documentElement.dataset.theme = v; try { localStorage.setItem('theme', v); } catch(e){}
    $('theme').textContent = v === 'dark' ? '☀' : '☾';
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = v === 'dark' ? '#0fb5ae' : '#0fb5ae'; };
  set(t); $('theme').onclick = () => set(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
})();
// share/save outbox
let outbox = null;
let mode = 'img', files = [];
const cfg = {
  img:     {accept:'image/*,.heic,.heif', multi:true,  txt:'Tap or drop image(s) here (HEIC works too)'},
  pdf2txt: {accept:'application/pdf,.pdf', multi:false, txt:'Tap or drop a PDF here'},
  txt2pdf: {accept:'.txt,text/plain', multi:false, txt:'Tap or drop a .txt file (optional)'}
};
const LV = {none:{q:0.92,max:1e9,s:2}, medium:{q:0.7,max:2000,s:1.5}, strong:{q:0.5,max:1200,s:1}};
const lv = () => LV[$('comp').value];
const custom = () => $('outname').value.trim().replace(/[\\/:*?"<>|]/g,'');
const N = def => custom() || def;
function status(m, err){ $('status').textContent = m; $('status').className = err ? 'err' : ''; }
function setMode(m){
  mode = m; files = []; status(''); edit = {rot:0, crop:null};
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  const c = cfg[m], f = $('file');
  f.value = ''; f.accept = c.accept; f.multiple = c.multi;
  $('dropText').textContent = c.txt;
  $('opt').classList.toggle('hide', m !== 'img');
  $('copt').classList.toggle('hide', m === 'txt2pdf');
  $('topt').classList.toggle('hide', m !== 'txt2pdf');
  $('popt').classList.toggle('hide', m !== 'pdf2txt');
  $('text').classList.toggle('hide', m !== 'txt2pdf');
  render();
}
let edit = {rot:0, crop:null}, prevImg = null;
async function refreshEditor(){
  const show = mode === 'img' && files.length > 0;
  $('editor').classList.toggle('hide', !show);
  $('cropReset').classList.toggle('hide', files.length !== 1);
  $('edhint').classList.toggle('hide', files.length !== 1);
  if (!show) { prevImg = null; return; }
  try { prevImg = await loadImg(files[0]); } catch(e){ prevImg = null; return; }
  drawPrev();
}
function rotated(img, rot){
  const c = document.createElement('canvas'), q = rot % 2;
  c.width = q ? img.naturalHeight : img.naturalWidth; c.height = q ? img.naturalWidth : img.naturalHeight;
  const x = c.getContext('2d'); x.translate(c.width/2, c.height/2); x.rotate(rot*Math.PI/2);
  x.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2); return c;
}
// source canvas for an image with rotation and (single image) crop applied
function sourceFor(img){
  let c = edit.rot ? rotated(img, edit.rot) : img;
  const w = c.width || c.naturalWidth, h = c.height || c.naturalHeight;
  if (files.length === 1 && edit.crop){
    const k = edit.crop, sx = Math.round(k.x*w), sy = Math.round(k.y*h), sw = Math.max(1, Math.round(k.w*w)), sh = Math.max(1, Math.round(k.h*h));
    const o = document.createElement('canvas'); o.width = sw; o.height = sh;
    o.getContext('2d').drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh); return o;
  }
  if (c === img){ const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(img,0,0); return o; }
  return c;
}
function drawPrev(){
  if (!prevImg) return;
  const r = rotated(prevImg, edit.rot), maxW = Math.min(420, document.body.clientWidth - 40), s = Math.min(1, maxW / r.width, 260 / r.height);
  const cv = $('prev'); cv.width = Math.round(r.width*s); cv.height = Math.round(r.height*s);
  const x = cv.getContext('2d'); x.drawImage(r, 0, 0, cv.width, cv.height);
  if (files.length === 1 && edit.crop){
    const k = edit.crop, rx = k.x*cv.width, ry = k.y*cv.height, rw = k.w*cv.width, rh = k.h*cv.height;
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0,0,cv.width,ry); x.fillRect(0,ry+rh,cv.width,cv.height-ry-rh);
    x.fillRect(0,ry,rx,rh); x.fillRect(rx+rw,ry,cv.width-rx-rw,rh);
    x.strokeStyle = '#0fb5ae'; x.lineWidth = 2; x.strokeRect(rx,ry,rw,rh);
  }
}
$('rotL').onclick = () => { edit.rot = (edit.rot + 3) % 4; edit.crop = null; drawPrev(); };
$('rotR').onclick = () => { edit.rot = (edit.rot + 1) % 4; edit.crop = null; drawPrev(); };
$('cropReset').onclick = () => { edit.crop = null; drawPrev(); };
(function(){
  const cv = $('prev'); let st = null;
  const pt = e => { const b = cv.getBoundingClientRect(); return {x: Math.min(1,Math.max(0,(e.clientX-b.left)/b.width)), y: Math.min(1,Math.max(0,(e.clientY-b.top)/b.height))}; };
  cv.addEventListener('pointerdown', e => { if (files.length !== 1) return; cv.setPointerCapture(e.pointerId); st = pt(e); });
  cv.addEventListener('pointermove', e => { if (!st) return; const p = pt(e);
    edit.crop = {x:Math.min(st.x,p.x), y:Math.min(st.y,p.y), w:Math.abs(p.x-st.x), h:Math.abs(p.y-st.y)}; drawPrev(); });
  cv.addEventListener('pointerup', () => { if (edit.crop && (edit.crop.w < 0.02 || edit.crop.h < 0.02)) { edit.crop = null; drawPrev(); } st = null; });
})();
function render(){
  $('files').textContent = files.map(f => f.name).join(', ');
  $('go').disabled = mode === 'txt2pdf' ? false : files.length === 0;
  $('share').disabled = $('go').disabled;
  $('shareNow').classList.add('hide');
  refreshEditor();
}
async function setFiles(list){
  list = [...list];
  if (mode === 'txt2pdf' && list[0]) { $('text').value = await list[0].text(); files = [list[0]]; }
  else files = cfg[mode].multi ? list : list.slice(0,1);
  edit = {rot:0, crop:null};
  render();
}
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('file').onchange = e => setFiles(e.target.files);
const drop = $('drop');
drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); setFiles(e.dataTransfer.files); };

const base = n => n.replace(/\.[^.]+$/, '');
function save(blob, name){
  if (outbox) { outbox.push(new File([blob], name, {type: blob.type})); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function loadImg(file){
  if (/\.hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)) {
    try { const r = await heic2any({blob:file, toType:'image/jpeg', quality:0.95}); file = new File([Array.isArray(r)?r[0]:r], file.name.replace(/\.hei[cf]$/i,'.jpg'), {type:'image/jpeg'}); }
    catch(e){ throw new Error('Cannot read HEIC: ' + file.name); }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode(); return img;
  } catch(e){ throw new Error('Cannot read image: ' + file.name); }
  finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}
function toBlob(canvas, type, q){
  return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Format not supported')), type, q == null ? 0.92 : q));
}
async function convertImages(){
  if ($('fmt').value === 'application/pdf') return imagesToPdf();
  const type = $('fmt').value, ext = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type];
  for (const f of files){
    const img = await loadImg(f);
    const src = sourceFor(img);
    const k = Math.min(1, lv().max / Math.max(src.width, src.height));
    const c = document.createElement('canvas'); c.width = Math.max(1,Math.round(src.width*k)); c.height = Math.max(1,Math.round(src.height*k));
    const x = c.getContext('2d');
    if (type === 'image/jpeg'){ x.fillStyle = '#fff'; x.fillRect(0,0,c.width,c.height); }
    x.drawImage(src,0,0,c.width,c.height);
    const idx = files.length > 1 && custom() ? '-' + (files.indexOf(f)+1) : '';
    save(await toBlob(c, type, lv().q), N(base(f.name)) + idx + '.' + ext);
  }
  status('Done: ' + files.length + ' file(s) saved');
}
async function imagesToPdf(){
  const {jsPDF} = window.jspdf; let pdf;
  for (let i = 0; i < files.length; i++){
    const img = await loadImg(files[i]);
    const src = sourceFor(img);
    const k = Math.min(1, lv().max / Math.max(src.width, src.height));
    const c = document.createElement('canvas'); c.width = Math.max(1,Math.round(src.width*k)); c.height = Math.max(1,Math.round(src.height*k));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(src,0,0,c.width,c.height);
    const data = c.toDataURL('image/jpeg', lv().q);
    const w = src.width * 0.75, h = src.height * 0.75; // px -> pt
    const o = w > h ? 'l' : 'p';
    if (!pdf) pdf = new jsPDF({orientation:o, unit:'pt', format:[w,h]}); else pdf.addPage([w,h], o);
    pdf.addImage(data, 'JPEG', 0, 0, w, h);
  }
  save(pdf.output('blob'), N(files.length === 1 ? base(files[0].name) : 'images') + '.pdf');
  status('Done: PDF saved');
}
const crcT = (()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function makeZip(entries){ // stored (no compression) zip
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const e of entries){
    const n=enc.encode(e.name),crc=crc32(e.data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,crc,true);
    h.setUint32(18,e.data.length,true);h.setUint32(22,e.data.length,true);h.setUint16(26,n.length,true);
    parts.push(new Uint8Array(h.buffer),n,e.data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);
    c.setUint32(20,e.data.length,true);c.setUint32(24,e.data.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),n);off+=30+n.length+e.data.length;
  }
  const cdLen=cd.reduce((a,x)=>a+x.length,0),end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,entries.length,true);end.setUint16(10,entries.length,true);end.setUint32(12,cdLen,true);end.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(end.buffer)],{type:'application/zip'});
}
async function pdfToImages(doc,type){
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type],nm=N(base(files[0].name)),entries=[];
  for(let p=1;p<=doc.numPages;p++){
    status('Rendering page '+p+' of '+doc.numPages+'...');
    const page=await doc.getPage(p),vp=page.getViewport({scale:lv().s}),c=document.createElement('canvas');
    c.width=vp.width;c.height=vp.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
    await page.render({canvasContext:x,viewport:vp}).promise;
    const blob=await toBlob(c,type,lv().q);
    if(doc.numPages===1){save(blob,nm+'.'+ext);status('Done: 1 page saved as '+ext.toUpperCase());return;}
    entries.push({name:nm+'-page'+p+'.'+ext,data:new Uint8Array(await blob.arrayBuffer())});
  }
  save(makeZip(entries),nm+'-pages.zip');
  status('Done: '+doc.numPages+' pages saved as a zip of '+ext.toUpperCase());
}
async function pdfCompress(doc){
  const L = $('comp').value === 'none' ? LV.medium : lv(), {jsPDF} = window.jspdf; let pdf;
  for (let p = 1; p <= doc.numPages; p++){
    status('Compressing page ' + p + ' of ' + doc.numPages + '...');
    const page = await doc.getPage(p), v1 = page.getViewport({scale:1}), vp = page.getViewport({scale:L.s});
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,c.width,c.height);
    await page.render({canvasContext:x, viewport:vp}).promise;
    const o = v1.width > v1.height ? 'l' : 'p';
    if (!pdf) pdf = new jsPDF({orientation:o, unit:'pt', format:[v1.width,v1.height]}); else pdf.addPage([v1.width,v1.height], o);
    pdf.addImage(c.toDataURL('image/jpeg', L.q), 'JPEG', 0, 0, v1.width, v1.height);
  }
  const blob = pdf.output('blob');
  save(blob, N(base(files[0].name) + '-compressed') + '.pdf');
  status('Done: ' + Math.round(files[0].size/1024) + ' KB to ' + Math.round(blob.size/1024) + ' KB (pages become images, text not selectable)');
}
async function pdfToText(){
  const doc = await pdfjsLib.getDocument({data: new Uint8Array(await files[0].arrayBuffer())}).promise;
  if ($('pfmt').value === 'pdfc') return pdfCompress(doc);
  if ($('pfmt').value !== 'text') return pdfToImages(doc, $('pfmt').value);
  let out = '';
  for (let p = 1; p <= doc.numPages; p++){
    status('Reading page ' + p + ' of ' + doc.numPages + '...');
    const tc = await (await doc.getPage(p)).getTextContent();
    let line = '';
    for (const it of tc.items){ line += it.str; if (it.hasEOL) line += '\n'; else if (it.str && !/\s$/.test(it.str)) line += ' '; }
    out += line.trim() + '\n\n';
  }
  if (!out.trim()) { status('No text found (scanned PDF? OCR is not supported)', true); return; }
  save(new Blob([out], {type:'text/plain'}), N(base(files[0].name)) + '.txt');
  status('Done: ' + doc.numPages + ' page(s) saved as text');
}
async function textToImages(t, type){
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type],nm=N(files[0]?base(files[0].name):'text');
  const S=2,PW=595*S,PH=842*S,M=50*S,LH=16*S,font=(12*S)+'px Helvetica, Arial, sans-serif';
  const mc=document.createElement('canvas').getContext('2d');mc.font=font;
  const lines=[];
  for(const para of t.replace(/\t/g,'    ').split('\n')){
    let cur='';
    for(const w of para.split(' ')){
      const tryl=cur?cur+' '+w:w;
      if(mc.measureText(tryl).width>PW-2*M&&cur){lines.push(cur);cur=w;}else cur=tryl;
    }
    lines.push(cur);
  }
  const per=Math.floor((PH-2*M)/LH),entries=[];let n=0;
  for(let i=0;i<lines.length||i===0;i+=per){
    const c=document.createElement('canvas');c.width=PW;c.height=PH;const x=c.getContext('2d');
    x.fillStyle='#fff';x.fillRect(0,0,PW,PH);x.fillStyle='#000';x.font=font;x.textBaseline='top';
    lines.slice(i,i+per).forEach((l,k)=>x.fillText(l,M,M+k*LH));
    n++;const blob=await toBlob(c,type);
    if(lines.length<=per){save(blob,nm+'.'+ext);status('Done: saved as '+ext.toUpperCase());return;}
    entries.push({name:nm+'-page'+n+'.'+ext,data:new Uint8Array(await blob.arrayBuffer())});
  }
  save(makeZip(entries),nm+'-pages.zip');
  status('Done: '+n+' pages saved as a zip of '+ext.toUpperCase());
}
async function textToPdf(){
  const t = $('text').value;
  if (!t.trim()) { status('Enter some text first', true); return; }
  if ($('tfmt').value !== 'pdf') return textToImages(t, $('tfmt').value);
  const {jsPDF} = window.jspdf, pdf = new jsPDF({unit:'pt', format:'a4'});
  const m = 50, W = pdf.internal.pageSize.getWidth() - 2*m, H = pdf.internal.pageSize.getHeight() - 2*m, lh = 16;
  pdf.setFont('helvetica','normal'); pdf.setFontSize(12);
  let y = m;
  for (const l of pdf.splitTextToSize(t.replace(/\t/g,'    '), W)){
    if (y > m + H){ pdf.addPage(); y = m; }
    pdf.text(l, m, y + 12); y += lh;
  }
  save(pdf.output('blob'), N(files[0] ? base(files[0].name) : 'text') + '.pdf');
  status('Done: PDF saved');
}
async function runConvert(share){
  $('go').disabled = true; $('share').disabled = true; $('shareNow').classList.add('hide'); status('Working...');
  outbox = share ? [] : null;
  try {
    await ({img:convertImages, img2pdf:imagesToPdf, pdf2txt:pdfToText, txt2pdf:textToPdf})[mode]();
    if (share) await doShare();
  } catch(e){ status(e.message || String(e), true); }
  outbox = null; $('go').disabled = mode === 'txt2pdf' ? false : files.length === 0; $('share').disabled = $('go').disabled;
}
let pending = [];
async function doShare(){
  pending = outbox || []; outbox = null;
  if (!pending.length) return;
  const data = {files: pending, title: 'Converted file'};
  if (!(navigator.canShare && navigator.canShare(data))) {
    pending.forEach(f => save(f, f.name)); pending = [];
    status('Sharing files is not supported here, so it was downloaded instead.'); return;
  }
  try { await navigator.share(data); status('Shared'); pending = []; }
  catch(e){
    if (e && e.name === 'AbortError') { status('Share cancelled'); pending = []; }
    else { status('Ready. Tap "Tap to share".'); $('shareNow').classList.remove('hide'); }
  }
}
$('shareNow').onclick = async () => {
  try { await navigator.share({files: pending, title: 'Converted file'}); status('Shared'); $('shareNow').classList.add('hide'); pending = []; }
  catch(e){ if (e && e.name === 'AbortError') status('Share cancelled'); else status('Could not open the share sheet', true); }
};
$('go').onclick = () => runConvert(false);
$('share').onclick = () => runConvert(true);
setMode('img');
