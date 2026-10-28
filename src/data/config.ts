// Contatos vazios não abrem serviços externos. mapsEmbedUrl recebe uma URL de incorporação do Google Maps.
// logoUrl fica reservado para personalização; o protótipo mantém o nome textual.
export const cafe = { name:'Cafeteria', description:'Explore o cardápio demonstrativo e monte seu pedido.', whatsapp:'', instagram:'', reviewUrl:'', hours:'Horário de funcionamento a definir', address:'Endereço da cafeteria', location:'', reference:'', mapsUrl:'', mapsEmbedUrl:'', phone:'', logoUrl:'', about:'Entre um compromisso e outro, existe espaço para uma boa pausa Um café, algo gostoso e um momento para desacelerar Essa é a experiência que queremos compartilhar com você' };
export const photo = (id:string,width=700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const images = {hero:photo('photo-1442512595331-e89e73853f31',1200),about:photo('photo-1501339847302-ac426a4a7cbb',1000)};
