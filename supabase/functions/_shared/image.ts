export function imageType(bytes:Uint8Array):{mime:string;extension:string}{
 if(bytes.length<32||bytes.length>5242880)throw new Error('Invalid size');
 const equal=(at:number,signature:number[])=>signature.every((value,i)=>bytes[at+i]===value);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(equal(0,[137,80,78,71,13,10,26,10])){
  if(!equal(12,[73,72,68,82])||view.getUint32(8)!==13)throw new Error('Invalid PNG');
  const width=view.getUint32(16),height=view.getUint32(20);if(!width||!height||width*height>24000000)throw new Error('Invalid dimensions');
  let at=8,hasPixels=false,ended=false;
  while(at+12<=bytes.length){const length=view.getUint32(at);if(at+length+12>bytes.length)throw new Error('Invalid chunk');const type=String.fromCharCode(...bytes.slice(at+4,at+8));
   if(!['IHDR','PLTE','IDAT','IEND','tRNS','sRGB','gAMA','cHRM','bKGD'].includes(type))throw new Error('Remove image metadata before upload');
   if(type==='IDAT')hasPixels=true;if(type==='IEND'){ended=length===0&&at+12===bytes.length;break;}at+=length+12;
  }
  if(!hasPixels||!ended)throw new Error('Invalid PNG');return{mime:'image/png',extension:'png'};
 }
 if(equal(0,[255,216,255])&&equal(bytes.length-2,[255,217])){
  let at=2,dimensions=false,scan=false;
  while(at+4<bytes.length){if(bytes[at]!==255)throw new Error('Invalid JPEG');const marker=bytes[at+1],length=view.getUint16(at+2);if(length<2||at+2+length>bytes.length)throw new Error('Invalid segment');
   if(marker===0xe1||marker===0xfe)throw new Error('Remove image metadata before upload');
   if([0xc0,0xc1,0xc2].includes(marker)){if(length<8)throw new Error('Invalid frame');const height=view.getUint16(at+5),width=view.getUint16(at+7);if(!width||!height||width*height>24000000)throw new Error('Invalid dimensions');dimensions=true;}
   if(marker===0xda){scan=true;break;}at+=length+2;
  }
  if(!dimensions||!scan)throw new Error('Invalid JPEG');return{mime:'image/jpeg',extension:'jpg'};
 }
 if(equal(0,[82,73,70,70])&&equal(8,[87,69,66,80])&&view.getUint32(4,true)+8===bytes.length){
  let at=12,pixels=false;
  while(at+8<=bytes.length){const type=String.fromCharCode(...bytes.slice(at,at+4)),length=view.getUint32(at+4,true);if(at+8+length>bytes.length)throw new Error('Invalid WebP');
   if(['EXIF','XMP ','ANIM','ANMF'].includes(type))throw new Error('Unsupported WebP metadata or animation');
   if(type==='VP8 '){if(length<10||!equal(at+11,[157,1,42]))throw new Error('Invalid VP8 frame');const width=view.getUint16(at+14,true)&16383,height=view.getUint16(at+16,true)&16383;if(!width||!height||width*height>24000000)throw new Error('Invalid dimensions');pixels=true;}
   if(type==='VP8L'){if(length<5||bytes[at+8]!==47)throw new Error('Invalid lossless frame');const packed=view.getUint32(at+9,true),width=(packed&16383)+1,height=((packed>>>14)&16383)+1;if(width*height>24000000)throw new Error('Invalid dimensions');pixels=true;}
   if(type==='VP8X'){if(length!==10)throw new Error('Invalid extended frame');const width=1+bytes[at+12]+(bytes[at+13]<<8)+(bytes[at+14]<<16),height=1+bytes[at+15]+(bytes[at+16]<<8)+(bytes[at+17]<<16);if(width*height>24000000)throw new Error('Invalid dimensions');}
   if(!['VP8 ','VP8L','VP8X','ALPH','ICCP'].includes(type))throw new Error('Unsupported chunk');at+=8+length+(length%2);
  }
  if(!pixels||at!==bytes.length)throw new Error('Invalid WebP');return{mime:'image/webp',extension:'webp'};
 }
 throw new Error('Only raster JPEG, PNG and WebP images are accepted');
}
