// Kenyan Counties and their Constituencies
export interface Constituency {
  name: string;
}

export interface County {
  name: string;
  constituencies: string[];
}

export const KENYAN_COUNTIES: County[] = [
  {
    name: 'Nairobi',
    constituencies: [
      'Westlands',
      'Dagoretti North',
      'Dagoretti South',
      'Langata',
      'Kibra',
      'Roysambu',
      'Kasarani',
      'Ruaraka',
      'Embakasi South',
      'Embakasi North',
      'Embakasi Central',
      'Embakasi East',
      'Embakasi West',
      'Makadara',
      'Kamukunji',
      'Starehe',
      'Mathare',
    ],
  },
  {
    name: 'Mombasa',
    constituencies: [
      'Changamwe',
      'Jomvu',
      'Kisauni',
      'Nyali',
      'Likoni',
      'Mvita',
    ],
  },
  {
    name: 'Kisumu',
    constituencies: [
      'Kisumu East',
      'Kisumu West',
      'Kisumu Central',
      'Seme',
      'Nyando',
      'Muhoroni',
      'Nyakach',
    ],
  },
  {
    name: 'Nakuru',
    constituencies: [
      'Nakuru Town East',
      'Nakuru Town West',
      'Bahati',
      'Gilgil',
      'Kuresoi North',
      'Kuresoi South',
      'Molo',
      'Njoro',
      'Naivasha',
      'Rongai',
      'Subukia',
    ],
  },
  {
    name: 'Kiambu',
    constituencies: [
      'Gatundu South',
      'Gatundu North',
      'Juja',
      'Thika Town',
      'Ruiru',
      'Githunguri',
      'Kiambu',
      'Kiambaa',
      'Kabete',
      'Kikuyu',
      'Limuru',
      'Lari',
    ],
  },
  {
    name: 'Machakos',
    constituencies: [
      'Machakos Town',
      'Mavoko',
      'Kathiani',
      'Yatta',
      'Kangundo',
      'Matungulu',
      'Mwala',
      'Masinga',
    ],
  },
  {
    name: 'Kajiado',
    constituencies: [
      'Kajiado North',
      'Kajiado Central',
      'Kajiado East',
      'Kajiado West',
      'Kajiado South',
    ],
  },
  {
    name: 'Uasin Gishu',
    constituencies: [
      'Ainabkoi',
      'Kapseret',
      'Kesses',
      'Moiben',
      'Soy',
      'Turbo',
    ],
  },
  {
    name: 'Kakamega',
    constituencies: [
      'Butere',
      'Mumias West',
      'Mumias East',
      'Matungu',
      'Khwisero',
      'Shinyalu',
      'Lurambi',
      'Ikolomani',
      'Lugari',
      'Malava',
      'Kabondo',
      'Navakholo',
    ],
  },
  {
    name: 'Bungoma',
    constituencies: [
      'Bumula',
      'Kabuchai',
      'Kanduyi',
      'Kimilili',
      'Mt. Elgon',
      'Sirisia',
      'Tongaren',
      'Webuye East',
      'Webuye West',
    ],
  },
  {
    name: 'Meru',
    constituencies: [
      'Igembe South',
      'Igembe Central',
      'Igembe North',
      'Tigania West',
      'Tigania East',
      'North Imenti',
      'Buuri',
      'Central Imenti',
      'South Imenti',
    ],
  },
  {
    name: 'Nyeri',
    constituencies: [
      'Tetu',
      'Kieni',
      'Mathira',
      'Othaya',
      'Mukurweini',
      'Nyeri Town',
    ],
  },
  {
    name: 'Kirinyaga',
    constituencies: ['Mwea', 'Gichugu', 'Ndia', 'Kirinyaga Central'],
  },
  {
    name: "Murang'a",
    constituencies: [
      'Kangema',
      'Mathioya',
      'Kiharu',
      'Kigumo',
      'Maragwa',
      'Kandara',
      'Gatanga',
    ],
  },
  {
    name: 'Embu',
    constituencies: ['Manyatta', 'Runyenjes', 'Mbeere South', 'Mbeere North'],
  },
  {
    name: 'Kitui',
    constituencies: [
      'Mwingi North',
      'Mwingi West',
      'Mwingi Central',
      'Kitui West',
      'Kitui Rural',
      'Kitui Central',
      'Kitui East',
      'Kitui South',
    ],
  },
  {
    name: 'Makueni',
    constituencies: [
      'Makueni',
      'Kilome',
      'Kaiti',
      'Kibwezi West',
      'Kibwezi East',
      'Mbooni',
    ],
  },
  {
    name: 'Nyandarua',
    constituencies: [
      'Kinangop',
      'Kipipiri',
      'Ol Kalou',
      'Ol Jorok',
      'Ndaragwa',
    ],
  },
  {
    name: 'Nyamira',
    constituencies: [
      'Kitutu Masaba',
      'West Mugirango',
      'North Mugirango',
      'Borabu',
    ],
  },
  {
    name: 'Kisii',
    constituencies: [
      'Bonchari',
      'South Mugirango',
      'Bomachoge Borabu',
      'Bobasi',
      'Bomachoge Chache',
      'Nyaribari Masaba',
      'Nyaribari Chache',
      'Kitutu Chache North',
      'Kitutu Chache South',
    ],
  },
  {
    name: 'Migori',
    constituencies: [
      'Rongo',
      'Awendo',
      'Suna East',
      'Suna West',
      'Uriri',
      'Nyatike',
      'Kuria West',
      'Kuria East',
    ],
  },
  {
    name: 'Homa Bay',
    constituencies: [
      'Kasipul',
      'Kabondo Kasipul',
      'Karachuonyo',
      'Rangwe',
      'Homa Bay Town',
      'Ndhiwa',
      'Suba North',
      'Suba South',
    ],
  },
  {
    name: 'Siaya',
    constituencies: [
      'Ugenya',
      'Ugunja',
      'Alego Usonga',
      'Gem',
      'Bondo',
      'Rarieda',
    ],
  },
  {
    name: 'Busia',
    constituencies: [
      'Teso North',
      'Teso South',
      'Nambale',
      'Matayos',
      'Butula',
      'Funyula',
      'Budalangi',
    ],
  },
  {
    name: 'Vihiga',
    constituencies: ['Vihiga', 'Sabatia', 'Hamisi', 'Luanda', 'Emuhaya'],
  },
  {
    name: 'Kericho',
    constituencies: [
      'Ainamoi',
      'Bureti',
      'Belgut',
      'Sigowet/Soin',
      'Kipkelion East',
      'Kipkelion West',
    ],
  },
  {
    name: 'Bomet',
    constituencies: [
      'Sotik',
      'Chepalungu',
      'Bomet East',
      'Bomet Central',
      'Konoin',
    ],
  },
  {
    name: 'Narok',
    constituencies: [
      'Narok North',
      'Narok East',
      'Narok South',
      'Narok West',
      'Kilgoris',
      'Emurua Dikirr',
    ],
  },
  {
    name: 'Trans Nzoia',
    constituencies: ['Kwanza', 'Endebess', 'Saboti', 'Kiminini', 'Cherangany'],
  },
  {
    name: 'Nandi',
    constituencies: [
      'Tinderet',
      'Aldai',
      'Nandi Hills',
      'Chesumei',
      'Emgwen',
      'Mosop',
    ],
  },
  {
    name: 'Baringo',
    constituencies: [
      'Baringo North',
      'Baringo Central',
      'Baringo South',
      'Mogotio',
      'Eldama Ravine',
      'Tiaty',
    ],
  },
  {
    name: 'Laikipia',
    constituencies: ['Laikipia West', 'Laikipia East', 'Laikipia North'],
  },
  {
    name: 'Samburu',
    constituencies: ['Samburu West', 'Samburu North', 'Samburu East'],
  },
  {
    name: 'Turkana',
    constituencies: [
      'Turkana North',
      'Turkana West',
      'Turkana Central',
      'Loima',
      'Turkana South',
      'Turkana East',
    ],
  },
  {
    name: 'West Pokot',
    constituencies: ['Kacheliba', 'Kapenguria', 'Sigor', 'Pokot South'],
  },
  {
    name: 'Elgeyo Marakwet',
    constituencies: [
      'Marakwet East',
      'Marakwet West',
      'Keiyo North',
      'Keiyo South',
    ],
  },
  {
    name: 'Kwale',
    constituencies: ['Msambweni', 'Lunga Lunga', 'Matuga', 'Kinango'],
  },
  {
    name: 'Kilifi',
    constituencies: [
      'Kilifi North',
      'Kilifi South',
      'Kaloleni',
      'Rabai',
      'Ganze',
      'Malindi',
      'Magarini',
    ],
  },
  {
    name: 'Tana River',
    constituencies: ['Garsen', 'Galole', 'Bura'],
  },
  {
    name: 'Lamu',
    constituencies: ['Lamu East', 'Lamu West'],
  },
  {
    name: 'Taita Taveta',
    constituencies: ['Taveta', 'Wundanyi', 'Mwatate', 'Voi'],
  },
  {
    name: 'Garissa',
    constituencies: [
      'Garissa Township',
      'Balambala',
      'Lagdera',
      'Dadaab',
      'Fafi',
      'Ijara',
    ],
  },
  {
    name: 'Wajir',
    constituencies: [
      'Wajir North',
      'Wajir East',
      'Tarbaj',
      'Wajir West',
      'Eldas',
      'Wajir South',
    ],
  },
  {
    name: 'Mandera',
    constituencies: [
      'Mandera West',
      'Banissa',
      'Mandera North',
      'Mandera South',
      'Mandera East',
      'Lafey',
    ],
  },
  {
    name: 'Marsabit',
    constituencies: ['Moyale', 'North Horr', 'Saku', 'Laisamis'],
  },
  {
    name: 'Isiolo',
    constituencies: ['Isiolo North', 'Isiolo South'],
  },
  {
    name: 'Tharaka Nithi',
    constituencies: ['Tharaka', "Chuka/Igambang'ombe", 'Maara'],
  },
];

export const getConstituenciesByCounty = (countyName: string): string[] => {
  const county = KENYAN_COUNTIES.find(c => c.name === countyName);
  return county ? county.constituencies : [];
};
