/* Coordinate indicative dei luoghi (centro del paese o della frazione).
   Chiave: "luogo|provincia" esattamente come in eventi.js. Valore: [latitudine, longitudine] */
const LUOGHI = {
'Albignasego|PD':[45.355,11.857],'Anguillara Veneta|PD':[45.138,11.885],'Arquà Petrarca|PD':[45.270,11.718],
'Arsego, San Giorgio delle Pertiche|PD':[45.580,11.935],'Bagnoli di Sopra|PD':[45.188,11.880],'Baone|PD':[45.245,11.687],
'Bastia di Rovolon|PD':[45.380,11.660],'Battaglia Terme|PD':[45.290,11.780],'Borgoricco|PD':[45.535,11.940],
'Bresseo, Teolo|PD':[45.360,11.710],'Brugine|PD':[45.296,11.993],'Campodoro|PD':[45.490,11.752],
'Casalserugo|PD':[45.323,11.913],'Castello di San Martino, Cervarese Santa Croce|PD':[45.403,11.690],'Cittadella|PD':[45.648,11.784],
'Codiverno, Vigonza|PD':[45.462,11.995],'Conche, Codevigo|PD':[45.237,12.180],'Conselve|PD':[45.230,11.875],
'Corte, Piove di Sacco|PD':[45.280,12.030],'Este|PD':[45.228,11.656],'Fiera di Padova|PD':[45.418,11.886],
'Limena|PD':[45.477,11.845],'Lozzo Atestino|PD':[45.293,11.630],'Luvigliano, Torreglia|PD':[45.338,11.715],
'Massanzago|PD':[45.555,12.008],'Mejaniga, Cadoneghe|PD':[45.445,11.920],'Monselice|PD':[45.242,11.750],
'Montagnana|PD':[45.232,11.465],'Montegrotto Terme|PD':[45.330,11.785],'Noventa Padovana|PD':[45.415,11.950],
'Ospedaletto Euganeo|PD':[45.222,11.610],'Padova|PD':[45.407,11.876],'Pernumia|PD':[45.260,11.787],
'Piazzola sul Brenta|PD':[45.540,11.785],'Piombino Dese|PD':[45.606,11.996],'Piove di Sacco|PD':[45.297,12.035],
'Polverara|PD':[45.310,11.955],'Portello, Padova|PD':[45.410,11.887],'Prato della Valle, Padova|PD':[45.398,11.876],
'Roncaglia, Ponte San Nicolò|PD':[45.380,11.920],'Ronchi, Villafranca Padovana|PD':[45.500,11.810],'Rubano|PD':[45.427,11.787],
'Rustega, Camposampiero|PD':[45.580,11.950],'San Luca, Tribano|PD':[45.212,11.840],'San Pietro Viminario|PD':[45.244,11.820],
'Sant\'Andrea, Campodarsego|PD':[45.510,11.930],'Santo Stefano, Due Carrare|PD':[45.295,11.835],'Saonara|PD':[45.369,11.988],
'Schiavonia d\'Este|PD':[45.215,11.700],'Solesino|PD':[45.178,11.746],'Taglie, Borgo Veneto|PD':[45.210,11.540],
'Teolo|PD':[45.350,11.672],'Terrassa Padovana|PD':[45.245,11.903],'Tombolo|PD':[45.640,11.828],
'Trebaseleghe|PD':[45.590,12.045],'Tribano|PD':[45.210,11.835],'Veggiano|PD':[45.448,11.715],
'Vigonza|PD':[45.444,11.980],'Villa Contarini, Piazzola sul Brenta|PD':[45.542,11.786],'Vo\' Euganeo|PD':[45.330,11.640],

'Belfiore, Pramaggiore|VE':[45.805,12.735],'Canal Grande, Venezia|VE':[45.437,12.334],'Caorle|VE':[45.600,12.886],
'Chioggia|VE':[45.218,12.279],'Concordia Sagittaria|VE':[45.756,12.845],'Cortellazzo, Jesolo|VE':[45.540,12.720],
'Dolo|VE':[45.425,12.075],'Lido di Venezia|VE':[45.405,12.367],'Loncon, Annone Veneto|VE':[45.786,12.705],
'Mirano|VE':[45.494,12.106],'Rio San Martino, Scorzè|VE':[45.580,12.120],'Robegano, Salzano|VE':[45.530,12.090],
'Salzano|VE':[45.524,12.106],'Sant\'Erasmo, Venezia|VE':[45.460,12.400],'Torre di Mosto|VE':[45.686,12.700],
'Venezia|VE':[45.434,12.338],

'Asiago|VI':[45.876,11.510],'Barbarano Mossano|VI':[45.408,11.542],'Breganze|VI':[45.707,11.564],
'Camisano Vicentino|VI':[45.522,11.708],'Costozza, Longare|VI':[45.476,11.600],'Gambellara|VI':[45.460,11.340],
'Grisignano di Zocco|VI':[45.474,11.700],'Longare|VI':[45.481,11.609],'Lumignano, Longare|VI':[45.465,11.610],
'Marostica|VI':[45.746,11.657],'Nove|VI':[45.723,11.678],'Sandrigo|VI':[45.660,11.598],
'Thiene|VI':[45.707,11.477],'Valbrenta|VI':[45.880,11.680],'Valrovina, Bassano del Grappa|VI':[45.790,11.740],

'Asolo|TV':[45.800,11.914],'Badoere, Morgano|TV':[45.623,12.096],'Castello di Godego|TV':[45.693,11.880],
'Catena, Villorba|TV':[45.733,12.240],'Cimadolmo|TV':[45.787,12.360],'Cison di Valmarino|TV':[45.968,12.143],
'Colmaggiore, Tarzo|TV':[45.990,12.240],'Dosson, Casier|TV':[45.640,12.270],'Montebelluna|TV':[45.775,12.045],
'Pederobba|TV':[45.877,11.950],'Pieve di Soligo|TV':[45.898,12.172],'Riese Pio X|TV':[45.730,11.920],
'Vidor|TV':[45.862,12.040],'Volpago del Montello|TV':[45.777,12.120],'Zero Branco|TV':[45.600,12.170],

'Arena, Verona|VR':[45.439,10.994],'Bardolino|VR':[45.548,10.722],'Castelnuovo del Garda|VR':[45.439,10.763],
'Fiera di Verona|VR':[45.423,10.985],'Garda|VR':[45.578,10.708],'Isola della Scala|VR':[45.271,11.006],
'Negrar di Valpolicella|VR':[45.530,10.938],'Piazza dei Signori, Verona|VR':[45.443,10.998],'San Giovanni Ilarione|VR':[45.520,11.237],
'Soave|VR':[45.420,11.246],'Valeggio sul Mincio|VR':[45.354,10.735],'Verona|VR':[45.438,10.992],

'Lendinara|RO':[45.084,11.597],'Porto Tolle|RO':[44.950,12.330],'Rasa, Lendinara|RO':[45.090,11.560],

'Cortina d\'Ampezzo|BL':[46.540,12.136],'Feltre|BL':[46.018,11.910],'Lamon|BL':[46.047,11.746],
'Pedavena|BL':[46.040,11.880],'Polpet, Sedico|BL':[46.111,12.093],
'Carmignano di Brenta|PD':[45.629, 11.703],'Cavallino-Treporti|VE':[45.475, 12.535],'Scorzè|VE':[45.572, 12.109],'Lonigo|VI':[45.388, 11.387],'Fiera di Vicenza|VI':[45.53, 11.508],'Bassano del Grappa|VI':[45.766, 11.734],'Dueville|VI':[45.636, 11.548],'Schio|VI':[45.713, 11.358],'Bassano Expo, Cassola|VI':[45.746, 11.775],'Monastier di Treviso|TV':[45.656, 12.433],'San Pietro di Feletto|TV':[45.915, 12.245],'Cologna Veneta|VR':[45.312, 11.383],'Cerea|VR':[45.193, 11.214]
};
