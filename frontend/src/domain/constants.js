// Constantes de presentación compartidas.

// Trazados SVG de los iconos del panel y la marca.
export const ICONOS = {
  inv: 'M5 4h14v17H5zM9 4h6v3H9zM9 12h6M9 16h4',
  act: 'M4 6h16M4 12h16M4 18h10',
  cat: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  adm: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6zM9 12l2 2 4-4',
  exp: 'M12 3v12M8 11l4 4 4-4M4 19h16',
  his: 'M12 7v5l3 2M3 12a9 9 0 1 0 2.5-6.3M3 4v3h3',
  usr: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M18 8v6M21 11h-6',
  // Ojo abierto (mostrar contraseña)
  ojo: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  // Ojo tachado (ocultar contraseña)
  ojoOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.4 4M6.1 7.1A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 3.3-.6',
}

// Estado de un registro en la cola: [claseCss, etiqueta].
export const ESTADO = {
  sincronizado: ['ok', 'Sincronizado'],
  pendiente: ['wa', 'Pendiente'],
  conflicto: ['er', 'Conflicto'],
}
