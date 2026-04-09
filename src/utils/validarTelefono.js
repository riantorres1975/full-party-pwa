/**
 * Validación de números telefónicos mexicanos.
 * Todos los números móviles y fijos en México son de 10 dígitos.
 * Los primeros 2 o 3 dígitos corresponden a la lada (código de área).
 *
 * Lista basada en el Plan de Numeración del IFT (Instituto Federal de Telecomunicaciones).
 * Se incluyen las ladas más comunes; números que no coincidan con ninguna lada real se rechazan.
 */

// Ladas válidas de México (2 y 3 dígitos) — fuente: IFT
// Se almacenan como Set para búsqueda O(1)
const LADAS_2 = new Set([
  '33', '55', '56', '81',
]);

const LADAS_3 = new Set([
  // Aguascalientes
  '449',
  // Baja California
  '646', '653', '658', '661', '664', '665', '686',
  // Baja California Sur
  '612', '613', '615', '624',
  // Campeche
  '981', '982', '996',
  // Chiapas
  '916', '918', '919', '932', '934', '961', '962', '963', '964', '965', '966', '967', '968',
  // Chihuahua
  '614', '621', '625', '627', '628', '629', '635', '636', '639', '649', '652', '656', '659',
  // Coahuila
  '840', '842', '844', '861', '862', '866', '867', '869', '871', '872', '873', '877', '878',
  // Colima
  '312', '313', '314',
  // CDMX (adicionales al 55/56)
  // Durango
  '618', '671', '674', '675', '676', '677',
  // Estado de México
  '588', '591', '592', '593', '594', '595', '596', '597', '598', '599',
  '712', '713', '714', '716', '718', '719', '721', '722', '723', '724', '725', '726', '727', '728',
  // Guanajuato
  '411', '412', '413', '414', '415', '417', '418', '419', '421', '428', '429',
  '432', '445', '461', '462', '464', '466', '468', '469', '472', '473', '474', '475', '476', '477', '478',
  // Guerrero
  '732', '733', '734', '735', '736', '737', '741', '742', '743', '744', '745', '746', '747', '751', '752', '753', '754', '755', '756', '757', '758',
  // Hidalgo
  '738', '739', '771', '772', '773', '774', '775', '776', '778', '779',
  // Jalisco
  '316', '317', '321', '322', '341', '342', '343', '344', '345', '346', '347', '348', '349',
  '351', '352', '353', '354', '355', '356', '357', '358',
  '371', '372', '373', '374', '375', '376', '377', '378', '379',
  '381', '382', '383', '384', '385', '386', '387', '388',
  '391', '392', '393', '394', '395',
  // Michoacán
  '271', '272', '273', '274',
  '351', '352', '353', '354', '355', '356', '381', '382', '383',
  '421', '422', '423', '424', '425', '426', '431', '434', '435', '436',
  '443', '447', '451', '452', '453', '454', '455',
  // Morelos
  '731', '734', '735', '736', '737', '751', '769', '777',
  // Nayarit
  '311', '319', '323', '324', '325', '327', '328', '329',
  // Nuevo León
  '812', '818', '821', '823', '824', '825', '826', '828', '829',
  // Oaxaca
  '274', '281', '283', '284', '285', '287', '951', '953', '954', '958', '971', '972',
  // Puebla
  '221', '222', '223', '224', '225', '226', '227', '228', '229',
  '231', '232', '233', '234', '235', '236', '237', '238', '241', '243', '244', '245', '246', '247', '248', '249',
  '261', '276', '278', '279', '282',
  // Querétaro
  '427', '441', '442', '448',
  // Quintana Roo
  '983', '984', '987', '997', '998',
  // San Luis Potosí
  '444', '481', '482', '483', '485', '486', '487', '488', '489',
  // Sinaloa
  '667', '668', '669', '672', '673', '687', '694', '695', '696', '697',
  // Sonora
  '622', '623', '631', '632', '633', '634', '637', '638', '641', '642', '643', '644', '645', '647', '648', '651',
  // Tabasco
  '913', '914', '917', '933', '936', '937', '993',
  // Tamaulipas
  '831', '832', '833', '834', '835', '836', '841', '843', '845', '846', '848', '864', '868', '891', '892', '893', '894', '897', '899',
  // Tlaxcala
  '241', '242', '246', '248',
  // Veracruz
  '226', '228', '229', '271', '272', '273', '274', '276', '278', '279',
  '281', '282', '283', '284', '285', '287', '288', '294', '296', '297',
  '921', '922', '923', '924',
  // Yucatán
  '985', '986', '988', '991', '992', '994', '995', '999',
  // Zacatecas
  '433', '437', '438', '439', '457', '458', '459', '463', '467', '471', '492', '493', '494', '496', '498', '499',
]);

/**
 * Valida que un número de teléfono sea un número mexicano real.
 * @param {string} telefono — solo dígitos, 10 caracteres
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarTelefonoMX(telefono) {
  const limpio = telefono.replace(/\D/g, '');

  if (limpio.length !== 10) {
    return { valido: false, error: 'El número debe tener exactamente 10 dígitos' };
  }

  // No permitir números con todos los dígitos iguales (1111111111, 0000000000, etc.)
  if (/^(\d)\1{9}$/.test(limpio)) {
    return { valido: false, error: 'Ingresa un número de teléfono real' };
  }

  // No permitir secuencias consecutivas (1234567890, 0987654321)
  if (limpio === '1234567890' || limpio === '0987654321') {
    return { valido: false, error: 'Ingresa un número de teléfono real' };
  }

  // Verificar que empiece con una lada válida
  const lada2 = limpio.slice(0, 2);
  const lada3 = limpio.slice(0, 3);

  if (!LADAS_2.has(lada2) && !LADAS_3.has(lada3)) {
    return { valido: false, error: 'La lada no corresponde a una región de México' };
  }

  return { valido: true };
}
