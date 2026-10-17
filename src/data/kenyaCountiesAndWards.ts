export interface CountyData {
  code: string;
  name: string;
  wards: string[];
}

export const KENYA_COUNTIES: CountyData[] = [
  {
    code: "001",
    name: "Mombasa",
    wards: [
      "Port Reitz", "Kipevu", "Airport", "Changamwe", "Chaani", "Jomvu Kuu", "Miritini", "Mikindani", 
      "Mjambere", "Junda", "Bamburi", "Mtwapa", "Mwakirunge", "Kisauni", "Nyali", "Frere Town", 
      "Ziwa La Ng'ombe", "Mkomani", "Kongowea", "Kadzandani", "Mtongwe", "Shika Adabu", "Bofu", 
      "Likoni", "Timbwani", "Mji wa Kale/Makadara", "Tudor", "Tononoka", "Shimanzi/Ganjoni", "Majengo"
    ]
  },
  {
    code: "002",
    name: "Kwale",
    wards: [
      "Pongwe/Kikoneni", "Dzombo", "Mwereni", "Ramisi", "Kinondo", "Gombato Bongwe", "Ukunda", 
      "Tiwi", "Diani", "Tsimba Golini", "Waa", "Kubo South", "Mkongani", "Ndavaya", "Puma", 
      "Kinango", "Mackinnon Road", "Chengoni/Samburu", "Mwavumbo", "Kasemeni"
    ]
  },
  {
    code: "003",
    name: "Kilifi",
    wards: [
      "Tezo", "Sokoni", "Kibarani", "Dabaso", "Matsangoni", "Watamu", "Mnarani", "Junju", 
      "Mwarakaya", "Shimo la Tewa", "Chasimba", "Mtepeni", "Mariakani", "Kayafungo", "Kaloleni", 
      "Mwanamwinga", "Mwawesa", "Ruruma", "Kambe/Ribe", "Rabai/Kisurutini", "Mugumo-wa-Patsa", 
      "Ganze", "Bamba", "Jaribuni", "Sokoke", "Marafa", "Magarini", "Gongoni", "Adu", "Garashi"
    ]
  },
  {
    code: "004",
    name: "Tana River",
    wards: [
      "Kipini East", "Garsen South", "Kipini West", "Garsen Central", "Garsen West", "Garsen North", 
      "Kinakomba", "Mikindani", "Chewani", "Wayu", "Madogo", "Bangale", "Sala", "Bura", "Chewele"
    ]
  },
  {
    code: "005",
    name: "Lamu",
    wards: [
      "Shella", "Mkomani", "Hindi", "Mkunumbi", "Hongwe", "Witu", "Bahari", "Faza", "Kiunga", "Basuba"
    ]
  },
  {
    code: "006",
    name: "Taita/Taveta",
    wards: [
      "Chala", "Mahoo", "Bomeni", "Mboghoni", "Mata", "Wundanyi/Mbale", "Werugha", "Wumingu/Kishushe", 
      "Mwanda/Mgange", "Ronge", "Mwatate", "Bura", "Chawia", "Wusi/Kishamba", "Mbololo", "Sagalla", 
      "Kaloleni", "Marungu", "Kasigau", "Ngolia"
    ]
  },
  {
    code: "007",
    name: "Garissa",
    wards: [
      "Waberi", "Galbet", "Township", "Iftin", "Balambala", "Sankuri", "Saka", "Nanighi", 
      "Damajale", "Liboi", "Dertu", "Dadaab", "Labasigale", "Damajaley", "Bura", "Dekaharia", 
      "Jarajila", "Fafi", "Hulugho", "Sangailu", "Masalani"
    ]
  },
  {
    code: "008",
    name: "Wajir",
    wards: [
      "Wagbari", "Township", "Barwago", "Khorof Harar", "Elben", "Sarman", "Tarbaj", "Wargadud", 
      "Bute", "Korondile", "Malkaguff", "Batalu", "Danaba", "Godoma", "Wagalla", "Habaswein", 
      "Muddo Gashe", "Benane", "Dadaja Bulla"
    ]
  },
  {
    code: "009",
    name: "Mandera",
    wards: [
      "Arabia", "Township", "Neboi", "Khalalio", "Libehia", "Ashabito", "Guticha", "Morothile", 
      "Rhamu", "Rhamu Dimtu", "Takaba South", "Takaba", "Lagsure", "Dandu", "Gither", "Banissa", 
      "Derkhale", "Guba", "Malkamari", "Kiliwehiri"
    ]
  },
  {
    code: "010",
    name: "Marsabit",
    wards: [
      "Butiye", "Sololo", "Uran", "Golbo", "Moyale Township", "Dukana", "Maikona", "Turbi", 
      "North Horr", "Illeret", "Sagante/Jaldesa", "Karare", "Marsabit Central", "Kargi/South Horr", 
      "Korr/Ngurunit", "Laisamis", "Logologo", "Loiyangalani"
    ]
  },
  {
    code: "011",
    name: "Isiolo",
    wards: [
      "Wabera", "Bulla Pesa", "Chari", "Cherab", "Ngaremara", "Burat", "Oldo/Nyiro", "Garbatulla", "Kinna", "Sericho"
    ]
  },
  {
    code: "012",
    name: "Meru",
    wards: [
      "Timau", "Kisima", "Kiirua/Nkando", "Ruiri/Rwarera", "Kibirichia", "Ntima East", "Ntima West", 
      "Nyaki West", "Nyaki East", "Municipality", "Mwanganthia", "Abothuguchi Central", "Abothuguchi West", 
      "Kiagu", "Kiegoi/Antubochiu", "Athiru Gaiti", "Akithi", "Karama", "Amwathi", "Nkomo", "Mikinduri"
    ]
  },
  {
    code: "013",
    name: "Tharaka-Nithi",
    wards: [
      "Gatunga", "Mukothima", "Tharaka North", "Tharaka South", "Chiakariga", "Marimanti", "Nkondi", 
      "Chuka", "Mugwe", "Mwimbi", "Ganga", "Mitheru", "Muthambi", "Magumoni"
    ]
  },
  {
    code: "014",
    name: "Embu",
    wards: [
      "Nginda", "Mbeti North", "Kirimari", "Gaturi South", "Kieni", "Evurore", "Mthara", "Mavuria", 
      "Mbeti South", "Kiambere", "Makima", "Kyeni North", "Kyeni South", "Runyenjes Central", "Kagaari South", "Kagaari North"
    ]
  },
  {
    code: "015",
    name: "Kitui",
    wards: [
      "Kyuso", "Mumoni", "Tseikuru", "Tharaka", "Ngomeni", "Kyatune", "Kyangwithya West", "Kyangwithya East", 
      "Mulango", "Township", "Miambani", "Mbitini", "Kanziko", "Ikanga/Kyatune", "Mutomo", "Mutha", 
      "Athi", "Ikutha", "Kauwi", "Matinyani", "Kwa Mutonga/Kithumula"
    ]
  },
  {
    code: "016",
    name: "Machakos",
    wards: [
      "Kalama", "Mua", "Mutituni", "Machakos Central", "Mumbuni North", "Muvuti/Kiima-Kimwe", "Kola", 
      "Kangundo North", "Kangundo Central", "Kangundo East", "Kangundo West", "Tala", "Matungulu North", 
      "Matungulu East", "Matungulu West", "Sengani", "Mitaboni", "Kathiani Central", "Upper Kaewa/Iveti", 
      "Lower Kaewa/Kaani", "Masinga Central", "Ekalakala", "Muthesya", "Ndithini", "Kivaa", "Yatta", 
      "Ikombe", "Katangi", "Kithimani", "Matuu", "Mavoko/Athi River", "Kinanie", "Muthwani", "Syokimau/Mlolongo"
    ]
  },
  {
    code: "017",
    name: "Makueni",
    wards: [
      "Tulimani", "Mbooni", "Kithungo/Kitundu", "Kisau/Kiteta", "Waia-Kako", "Kalawa", "Ukia", 
      "Kee", "Kilungu", "Ilima", "Kaiti", "Wote/Nziu", "Muvau/Kikuumini", "Mavindini", "Kitise/Kithuki", 
      "Kathonzweni", "Nzaui/Kilili/Kalamba", "Mbitini", "Kasikeu", "Mukaa", "Kiima Kiu/Kalanzoni", 
      "Makindu", "Nguumo", "Kikumbulyu North", "Kikumbulyu South", "Nguu/Masumba", "Mtito Andei"
    ]
  },
  {
    code: "018",
    name: "Nyandarua",
    wards: [
      "Karau", "Kanjuiri Range", "Mirangine", "Rurii", "Ol Kalou", "Kaimbaga", "Shamata", "Gathanji", 
      "Gatimu", "Weru", "Kipipiri", "Geta", "Githioro", "Wanjohi", "Murungaru", "Engineer", "Magumu", 
      "Kinangop", "Njabini/Kiburu"
    ]
  },
  {
    code: "019",
    name: "Nyeri",
    wards: [
      "Dedan Kimathi", "Wamagana", "Aguthi-Gaaki", "Mweiga", "Endarasha/Mwiyogo", "Mugunda", "Gatarakwa", 
      "Thegu River", "Rugi", "Magutu", "Iria-Iteni", "Kirimukuyu", "Karatina Town", "Mahiga", "Iriaini", 
      "Chinga", "Karima", "Mukurwe-ini West", "Mukurwe-ini Central", "Gikondi", "Kiganjo/Mathari", 
      "Rware", "Gatitu/Muruguru", "Ruring'u", "Kamakwa/Mukaro"
    ]
  },
  {
    code: "020",
    name: "Kirinyaga",
    wards: [
      "Mutithi", "Kangai", "Thiba", "Wamumu", "Nyangati", "Murinduko", "Gathigiriri", "Tebere", 
      "Kabare", "Baragwi", "Njukiini", "Ngariama", "Karumandi", "Kerugoya", "Inoi", "Kanyekini", "Kariti"
    ]
  },
  {
    code: "021",
    name: "Murang'a",
    wards: [
      "Kangema", "Muguru", "Rwathia", "Kanyenya-ini", "Gitugi", "Kiru", "Kamacharia", "Wangu", 
      "Mugoiri", "Mbiri", "Township", "Murarandia", "Gaturi", "Kahuhia", "Gaichanjiru", "Ithiru", 
      "Ruchu", "Kamahuha", "Kigumo", "Kangari", "Kinyona", "Makuyu", "Kambiti", "Maragua Ridge"
    ]
  },
  {
    code: "022",
    name: "Kiambu",
    wards: [
      "Kiamwangi", "Kiganjo", "Madaraka", "Ngenda", "Chania", "Mang'u", "Mitero", "Ndarugu", 
      "Gatuanyaga", "Ngoliba", "Kamenu", "Hospital", "Thika Town", "Township", "Biashara", "Gitothua", 
      "Membley", "Ruiru", "Kahawa Sukari", "Kahawa Wendani", "Kiuu", "Mwiki", "Mwihoko", "Githurai", 
      "Theta", "Juja", "Witeithie", "Kalimoni", "Ndenderu", "Karuri", "Muchatha", "Kihara", "Banana", 
      "Ruaka", "Kikuyu", "Sigona", "Karai", "Kinoo", "Nachu", "Limuru Central", "Limuru East", 
      "Ndeiya", "Bibirioni", "Tigoni/Gheso", "Ngecha Tigoni", "Lari", "Kirenga", "Kijabe", "Kamburu", "Nyanduma"
    ]
  },
  {
    code: "023",
    name: "Turkana",
    wards: [
      "Kaeris", "Lake Zone", "Kalokol", "Kang'atotha", "Kerio Delta", "Lodwar Township", "Kanamkemer", 
      "Lokichar", "Katilu", "Lokori/Kochodin", "Kalapata", "Lokichoggio", "Songot", "Kakuma", "Letea", 
      "Lokiriama/Lorengippi", "Kibish", "Nakalale"
    ]
  },
  {
    code: "024",
    name: "West Pokot",
    wards: [
      "Suam", "Kodich", "Kasei", "Kapchok", "Kiwawa", "Alale", "Sekerr", "Masool", "Weiwei", 
      "Lomut", "Riwo", "Kapenguria", "Mnagei", "Siyoi", "Endugh", "Sook", "Batei", "Lelan", "Chepareria"
    ]
  },
  {
    code: "025",
    name: "Samburu",
    wards: [
      "Lodokejek", "Suguta Marmar", "Maralal", "Loosuk", "Porro", "Wamba North", "Wamba West", 
      "Wamba East", "Waso", "Ndoto", "Nyiro", "Nachola", "Angata Nanyokie", "Baawa"
    ]
  },
  {
    code: "026",
    name: "Trans Nzoia",
    wards: [
      "Sikhendu", "Kaplamai", "Makutano", "Sitatunga", "Motosiet", "Matisi", "Tuwani", "Hospital", 
      "Kwanza", "Keiyo", "Bidii", "Kapomboi", "Kinyoro", "Chepsiro/Kiptoror", "Endebess", "Matumbei", 
      "Cherangany", "Suwerwa", "Sinyerere"
    ]
  },
  {
    code: "027",
    name: "Uasin Gishu",
    wards: [
      "Simat/Kapseret", "Kipkenyo", "Ngeria", "Megun", "Langas", "Racecourse", "Huruma", "Kamukunji", 
      "Kapsaos", "Kapyemit", "Pioneer/Elgon View", "Kimumu", "Kapsoya", "Kuinet/Kapsuswa", "Ainabkoi/Olare", 
      "Kapsobor", "Kaptagat", "Tarakwa", "Moiben", "Sergoit", "Karuna/Meibeki", "Segero/Barsombe", 
      "Soy", "Ziwa", "Kipsomba"
    ]
  },
  {
    code: "028",
    name: "Elgeyo/Marakwet",
    wards: [
      "Kapyego", "Sambirir", "Endo", "Sengwer", "Cherang'any/Chebororwa", "Moiben/Kuserwo", "Kapsowar", 
      "Kamariny", "Emsoo", "Tambach", "Chepkorio", "Soy North", "Soy South", "Kabiemit", "Metkei"
    ]
  },
  {
    code: "029",
    name: "Nandi",
    wards: [
      "Songhor/Soba", "Tinderet", "Chemase", "Kapsimotwo", "Chemelil/Chemase", "Kapchorua", "Chepkumia", 
      "Kapkangani", "Kapsabet", "Kilibwoni", "Chepterwai", "Kipkaren", "Kurgung/Surungai", "Kabiyet", 
      "Ndalat", "Kabisaga", "Sangalo/Kebulonik", "Terik", "Kemeloi-Maraba", "Kobujoi", "Kaptumo-Kaboi", "Koyo-Ndurio"
    ]
  },
  {
    code: "030",
    name: "Baringo",
    wards: [
      "Tembelic", "Kabarnet", "Sacho", "Tenges", "Ewalel Chapchap", "Kapropita", "Marigat", "Ilchamus", 
      "Mochongoi", "Mukutani", "Mogotio", "Emining", "Kisanana", "Eldama Ravine", "Lembus", "Lembus Kwen", 
      "Ravine", "Mumberes/Maji Mazuri", "Lembus/Pekerra", "Kabartonjo", "Saimo/Kipsaraman", "Bartabwa", 
      "Barwessa", "Ripkwo", "Kollowa", "Tiaty", "Silale", "Tangulbei/Korossi", "Churo/Amaya"
    ]
  },
  {
    code: "031",
    name: "Laikipia",
    wards: [
      "Ngobit", "Tigithi", "Thingithu", "Nanyuki", "Umande", "Sosian", "Segera", "Mugogodo West", 
      "Mugogodo East", "Rumuruti Township", "Githiga", "Marmanet", "Igwamiti", "Salama", "Ol-Moran"
    ]
  },
  {
    code: "032",
    name: "Nakuru",
    wards: [
      "Mariashoni", "Elburgon", "Turi", "Molo", "Kamara", "Keringet", "Kiptororo", "Nyota", 
      "Sirikwa", "Amalo", "Olenguruone", "Kiptagich", "Barut", "London", "Kaptembwo", "Kapkures", 
      "Rhoda", "Kivumbini", "Flamingo", "Menengai", "Nakuru East", "Biashara", "Viwandani", 
      "Maiella", "Olkaria", "Naivasha East", "Hell's Gate", "Lake View", "Mai Mahiu", "Gilgil", 
      "Elementaita", "Mbaruk/Eburu", "Malewa West", "Murindat", "Subukia", "Waseges", "Kabazi", 
      "Rongai", "Menengai West", "Soin", "Visoi", "Mosop", "Solai"
    ]
  },
  {
    code: "033",
    name: "Narok",
    wards: [
      "Kilgoris Central", "Keyian", "Angata Barikoi", "Shankoe", "Kimintet", "Lolgorian", "Ilkerin", 
      "Ololmasani", "Mogondo", "Kapsasian", "Olpusimoru", "Olokurto", "Nkware", "Narok Town", 
      "Olchorro Oirowua", "Sagoo", "Melili", "Mara", "Siana", "Naikarra", "Ololulung'a", "Melelo", 
      "Loita", "Maji Moto/Naroosura", "Suswa", "Keekonyokie", "Mosiro", "Ildamat"
    ]
  },
  {
    code: "034",
    name: "Kajiado",
    wards: [
      "Olkeri", "Ongata Rongai", "Nkaimurunya", "Oloolua", "Ngong", "Purko", "Ildamat", "Dalalekutuk", 
      "Matapato North", "Matapato South", "Kaputiei North", "Kitengela", "Oloosirkon/Sholinke", 
      "Kenyawa-Poka", "Magadi", "Iloodokilani", "Keekonyokie", "Mosiro", "Ewuaso Oonkidong'i", 
      "Entonet/Mbirikani", "Rombo", "Kuku", "Kimana", "Oloitokitok"
    ]
  },
  {
    code: "035",
    name: "Kericho",
    wards: [
      "Londiani", "Kedowa/Kimugul", "Chepseon", "Tendeno/Sorget", "Kipkelion", "Chilchila", "Kamasian", 
      "Kipchimchim", "Kapsoit", "Ainamoi", "Kipchebor", "Kapkugerwet", "Kapsaos", "Tebesonik", 
      "Cheboin", "Chemillil", "Litein", "Cheplanget", "Kapkatet", "Kisiara", "Waldai", "Sigowet", "Soin"
    ]
  },
  {
    code: "036",
    name: "Bomet",
    wards: [
      "Silibwet Township", "Ndaraweta", "Singorwet", "Chesoen", "Mutarakwa", "Longisa", "Sigor", 
      "Chebunyo", "Nyangores", "Merigi", "Kembu", "Siongiroi", "Kong'asis", "Boito", "Mogogosiek", 
      "Embomos", "Chemaner", "Kimulot"
    ]
  },
  {
    code: "037",
    name: "Kakamega",
    wards: [
      "Lugari", "Lumakanda", "Chekalini", "Chevaywa", "Lwandeti", "Likuyani", "Sango", "Kongoni", 
      "Nzoia", "Sinoko", "Shirugu-Mugai", "Manda-Shivanga", "Chemuche", "Kabras South", "Kabras North", 
      "Butali/Chegulo", "Manda", "Shirere", "Bukhungu", "Mahiakalo", "Shieywe", "Maraba", "Amalemba", 
      "Butsotso East", "Butsotso South", "Butsotso Central", "Shinyalu", "Isukha North", "Isukha Central", 
      "Isukha South", "Isukha East", "Isukha West", "Murhanda", "Ikolomani", "Idakho South", "Idakho East", 
      "Idakho North", "Idakho Central", "Kisa North", "Kisa East", "Kisa West", "Kisa Central", 
      "Koyonzo", "Kholera", "Khalaba", "Mayoni", "Namamali", "Marama West", "Marama Central", "Marama North", 
      "Marama South", "Bunyala West", "Bunyala Central", "Bunyala East"
    ]
  },
  {
    code: "038",
    name: "Vihiga",
    wards: [
      "Lugaga-Wamuluma", "South Maragoli", "Central Maragoli", "Mungoma", "Shiru", "Gisambai", 
      "Shamakhokho", "Banja", "Tambua", "Jepkoyai", "Luanda South", "Luanda Township", "Wemilabi", 
      "Mwibona", "Emabungo", "Central Bunyore", "West Bunyore", "North East Bunyore"
    ]
  },
  {
    code: "039",
    name: "Bungoma",
    wards: [
      "Kabuchai/Chwele", "West Nalondo", "Bwake/Luuya", "Mukuyuni", "South Bukusu", "Khasoko", "Kabula", 
      "Bumula", "Kimaeti", "South Mateka", "Siboti", "West Bukusu", "Malakisi/South Kulisiru", "Sirisia", 
      "Lwandanyi", "Namwela", "Cheptais", "Chesikaki", "Kaptama", "Kopsiro", "Bukembe West", "Bukembe East", 
      "Township", "Khalaba", "Musikoma", "Kanduyi", "Kibingei", "Kimilili", "Maeni", "Kamukuywa", 
      "Mbakalo", "Naitiri/Kabuyefwe", "Milima", "Ndalu/Tabani", "Tongaren", "Soet"
    ]
  },
  {
    code: "040",
    name: "Busia",
    wards: [
      "Malaba Central", "Malaba North", "Malaba South", "Ang'urai South", "Ang'urai North", "Ang'urai East", 
      "Chakoi South", "Amukura West", "Amukura East", "Amukura Central", "Bachi", "Bukhayo North/Walatsi", 
      "Bukhayo Central", "Bukhayo West", "Matayos South", "Busia Township", "Mayenje", "Burumba", 
      "Nambale Township", "Bukhayo East", "Marachi West", "Marachi Central", "Marachi East", "Kingandole", 
      "Marachi North", "Nambuku/Namboboto", "Nangina", "Ageng'a Nanguba", "Bwiri", "Funyula", "Bunyala North", 
      "Bunyala Central", "Bunyala South"
    ]
  },
  {
    code: "041",
    name: "Siaya",
    wards: [
      "West Yimbo", "Central Sakwa", "South Sakwa", "Yimbo East", "West Sakwa", "North Sakwa", "Bondo Town", 
      "Usigu", "Got Agulu", "Uyoma West", "South Uyoma", "West Asembo", "Central Asembo", "East Asembo", 
      "North Uyoma", "North Gem", "West Gem", "Central Gem", "Yala Township", "East Gem", "South Gem", 
      "Siaya Township", "West Alego", "Central Alego", "North Alego", "South East Alego", "Usonga", 
      "Ugunja", "Sidindi", "Sigomere", "Uholo"
    ]
  },
  {
    code: "042",
    name: "Kisumu",
    wards: [
      "Kisumu North", "West Kisumu", "Central Kisumu", "Kisumu South West", "North West Kisumu", 
      "South West Nyakach", "North Nyakach", "Central Nyakach", "West Nyakach", "East Nyakach", 
      "Kobura", "Kabonyo/Kanyagwal", "Kadibo", "Awasi/Onjiko", "Ahero", "Chemelil", "Muhoroni/Koru", 
      "Miwani", "Ombeyi", "Masogo/Nyang'oma", "Seme", "West Seme", "Central Seme", "East Seme", 
      "Kolwa East", "Manyatta B", "Nyalenda A", "Kolwa Central", "Kajulu", "Railways", "Migosi", 
      "Stadium", "Market Milimani", "Kaloleni/Shauri Moyo", "Nyalenda B", "Kisumu Central"
    ]
  },
  {
    code: "043",
    name: "Homa Bay",
    wards: [
      "West Karachuonyo", "Kendu Bay Town", "Wang'chieng", "Kibiri", "North Karachuonyo", "Central Karachuonyo", 
      "Kanyaluo", "Rachuonyo South", "Kasipul", "West Kasipul", "South Kasipul", "Central Kasipul", 
      "East Kamagak", "West Kamagak", "Kokwanyo/Kakelo", "Kojwach", "Kabondo East", "Kabondo West", 
      "Homa Bay Central", "Homa Bay Arujo", "Homa Bay West", "Homa Bay East", "Kwabwai", "Kanyamwa Kologi", 
      "Kanyamwa Kosewe", "Riana", "Kabuoch North", "Kabuoch South/Pala", "Kanyikela", "Kanyidoto", 
      "Gwassi South", "Gwassi North", "Rusinga Island", "Mfangano Island", "Lambwe", "Gembe"
    ]
  },
  {
    code: "044",
    name: "Migori",
    wards: [
      "South Sakwa", "North Sakwa", "Central Sakwa", "West Sakwa", "Suna Central", "Suna South", 
      "Suna West", "Ragana-Oruba", "Wasweta II", "Bukira East", "Bukira Central/Ikerege", "Isibania", 
      "Makerero", "Masaba", "Tagare", "Nyamosense/Kuria", "Gokeharaka/Getambwega", "Ntimaru West", 
      "Ntimaru East", "Nyabasi East", "Nyabasi West", "Kaler", "Macalder/Kanyarwanda", "Kanyasa", 
      "Got Kachola", "Muhuru", "West Kanyamkago", "Central Kanyamkago", "South Kanyamkago", "North Kanyamkago"
    ]
  },
  {
    code: "045",
    name: "Kisii",
    wards: [
      "Tabaka", "Boikanga", "Bogetenga", "Moticho", "Getenga", "Bomariba", "Bogiakumu", "Bonchari", 
      "Riana", "Bokeira", "Bomwagamo", "Bonyamatuta", "Masige West", "Masige East", "Bobasi Central", 
      "Bobasi Chache", "Sameta/Mokwerero", "Bassi Bogetaorio", "Bobasi Boitangare", "Nyacheki", 
      "Bassi Chache", "Majoge Basi", "Boochi/Tendere", "Magenche", "Sengera/Bosoti", "Nyansiongo", 
      "Kitutu Chache North", "Marani", "Sensi", "Mwamonari", "Kegogi", "Nyakoe", "Kitutu Chache South", 
      "Bogusero", "Bogeka", "Nyatieko", "Kisii Central", "Daraja Mbili", "Kiamwasi", "Kiamokama", "Masaba South"
    ]
  },
  {
    code: "046",
    name: "Nyamira",
    wards: [
      "Rigoma", "Gachuba", "Kemera", "Magombo", "Manga", "Nyamaiya", "Bogichora", "Bosamaro", 
      "Bonyamatuta", "Township", "Kiabonyoru", "Nyasiongo", "Esise", "Mekenene", "Bokeira", 
      "Magwagwa", "Ekerenyo", "Itibo", "Bomwagamo"
    ]
  },
  {
    code: "047",
    name: "Nairobi City",
    wards: [
      "Kangemi", "Kitusuru", "Karura", "Mountain View", "Parklands/Highridge", 
      "Kilimani", "Kawangware", "Gatina", "Kileleshwa", "Kabiro",
      "Mutu-ini", "Ngando", "Riruta", "Uthiru/Ruthimitu", "Waithaka",
      "Karen", "Nairobi West", "Mugumo-ini", "South C", "Nyayo Highrise",
      "Laini Saba", "Lindi", "Makina", "Woodley/Kenyatta Golf Course", "Sarang'ombe",
      "Githurai", "Kahawa West", "Zimmerman", "Roysambu", "Kahawa",
      "Clay City", "Mwiki", "Kasarani", "Njiru", "Ruai",
      "Babadogo", "Utalii", "Mathare North", "Lucky Summer", "Korogocho",
      "Imara Daima", "Kwa Njenga", "Kwa Reuben", "Pipeline", "Kware",
      "Kariobangi North", "Dandora Area I", "Dandora Area II", "Dandora Area III", "Dandora Area IV",
      "Kayole North", "Kayole Central", "Kayole South", "Komarock", "Matopeni/Spring Valley",
      "Upper Savanna", "Lower Savanna", "Embakasi", "Utawala", "Mihango",
      "Umoja I", "Umoja II", "Mowlem", "Kariobangi South",
      "Maringo/Hamza", "Viwandani", "Harambee", "Makongeni",
      "Pumwani", "Eastleigh North", "Eastleigh South", "Airbase", "California",
      "Nairobi Central", "Ngara", "Pangani", "Ziwani/Kariokor", "Landimawe", "Nairobi South",
      "Hospital", "Mabatini", "Huruma", "Ngei", "Mlango Kubwa", "Kiamaiko"
    ]
  }
];

export function getAllCountyNames(): string[] {
  return KENYA_COUNTIES.map(c => c.name);
}

export function getWardsForCounty(countyName: string): string[] {
  const matched = KENYA_COUNTIES.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  return matched ? matched.wards : [];
}

export function getAllWardsList(): { ward: string; county: string; countyCode: string }[] {
  const list: { ward: string; county: string; countyCode: string }[] = [];
  for (const c of KENYA_COUNTIES) {
    for (const w of c.wards) {
      list.push({ ward: w, county: c.name, countyCode: c.code });
    }
  }
  return list;
}

export function searchKenyaWards(query: string, limit = 25): { ward: string; county: string; countyCode: string }[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: { ward: string; county: string; countyCode: string }[] = [];
  for (const c of KENYA_COUNTIES) {
    for (const w of c.wards) {
      if (w.toLowerCase().includes(q)) {
        results.push({ ward: w, county: c.name, countyCode: c.code });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

export function findCountyByWard(wardName: string): string | null {
  if (!wardName) return null;
  const q = wardName.trim().toLowerCase();
  for (const c of KENYA_COUNTIES) {
    if (c.wards.some(w => w.toLowerCase() === q)) {
      return c.name;
    }
  }
  return null;
}

export const TOTAL_KENYA_COUNTIES = KENYA_COUNTIES.length;
export const TOTAL_KENYA_WARDS = KENYA_COUNTIES.reduce((acc, c) => acc + c.wards.length, 0);

