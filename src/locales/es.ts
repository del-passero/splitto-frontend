// src/locales/es.ts
export default {
  /* =============================
   * Navegación / secciones principales
   * ============================= */
  main: "Inicio",
  groups: "Grupos",
  group: "Grupo",
  contacts: "Contactos",
  profile: "Perfil",

  /* =============================
   * Acciones comunes, estados, botones
   * ============================= */
  actions: "Acciones",
  edit: "Editar",
  cancel: "Cancelar",
  save: "Guardar",
  close: "Cerrar",
  delete: "Eliminar",
  clear: "Limpiar",
  apply: "Aplicar",
  reset_filters: "Restablecer",
  loading: "Cargando...",
  saving: "Guardando...",
  save_failed: "No se pudo guardar",
  delete_failed: "No se pudo eliminar",
  error: "Error",

  /* =============================
   * Cuenta / Ajustes / Idioma / Tema
   * ============================= */
  account: "Cuenta",
  settings: "Ajustes",
  about: "Acerca de",
  theme: "Tema",
  choose_theme: "Elegir tema",
  theme_auto: "Desde Telegram",
  theme_light: "Claro",
  theme_dark: "Oscuro",
  language: "Idioma",
  choose_language: "Elegir idioma",
  language_auto: "Desde Telegram",
  language_ru: "Ruso",
  language_en: "Inglés",
  language_es: "Español",
  not_specified: "No especificado",
  version: "Versión",

  /* =============================
   * Fechas / Última actividad / Formatos
   * ============================= */
  last_activity_label: "Actividad",
  last_activity_today: "hoy",
  last_activity_yesterday: "ayer",
  last_activity_days_ago: "hace {{count}} días",
  last_activity_inactive: "Sin actividad",
  date_card: {
    pattern: "{{day}} {{month}}",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"],
  },

  /* =============================
   * Comunes (sí/no), monedas, categorías
   * ============================= */
  common: { yes: "Sí", no: "No" },
  currency: {
    select_title: "Seleccionar moneda",
    search_placeholder: "Buscar moneda",
    not_found: "No se encontró nada",
    main_currency: "Moneda principal",
    select_short: "Elegir moneda",
    currency_popular: "Populares",
  },
  category: {
    select_title: "Seleccionar categoría",
    search_placeholder: "Buscar categoría",
    not_found: "No se encontró nada",
  },

  /* =============================
   * Errores (anidado)
   * ============================= */
  errors: {
    group_name_required: "Ingrese el nombre del grupo",
    group_trip_date_required: "Indique la fecha del viaje",
    create_group_failed: "No se pudo crear el grupo",
    friends_load: "No se pudieron cargar los amigos",
    friends_search: "No se pudo realizar la búsqueda",
    contact_load: "No se pudo cargar el contacto",
    common_groups_load: "No se pudieron cargar los grupos en común",
    contact_friends_load: "No se pudieron cargar los amigos del contacto",
    error_friends_list: "No se pudo cargar la lista de amigos",
    tx_delete_forbidden_expense: "Solo el autor o quien pagó puede eliminar el gasto",
    tx_delete_forbidden_transfer: "Solo el autor o el remitente puede eliminar la transferencia",
    delete_forbidden:
      "Solo el autor o quien pagó/remitente puede eliminar una transacción",
    amount_positive: "El importe debe ser mayor que 0",
  },

  /* =============================
   * Grupos — lista, tarjeta, miembros, estados
   * ============================= */
  create_group: "Crear grupo",
  edit_group: "Editar grupo",
  no_groups: "No hay grupos",
  groups_not_found: "No se encontraron grupos",
  group_not_found: "Grupo no encontrado",
  group_name_placeholder: "Nombre del grupo",
  group_description_placeholder: "Descripción del grupo",
  group_name_required: "Ingrese el nombre del grupo",
  error_create_group: "Error al crear el grupo",
  error_edit_group: "Error al editar el grupo",
  participants: "Participantes",
  members: "Miembros",
  owner: "Creador",
  no_participants: "No hay participantes",
  add_participants: "Agregar participantes",
  empty_members: "No hay participantes",
  groups_count: "Total de grupos: {{count}}",
  groups_top_info: "Tienes {{count}} grupos activos",
  empty_groups: "Aún no tienes grupos",
  empty_groups_hint:
    "Crea tu primer grupo para gestionar gastos compartidos sin salir de Telegram.",
  search_group_placeholder: "Buscar grupo...",
  debts_reserved: "Deudas — ¡próximamente!",
  and_more_members: "y {{count}} más",
  group_members_count: "{{count}} miembros",
  group_status_archived: "Archivado",
  group_status_deleted: "Eliminado",
  group_linked_telegram: "Vinculado a Telegram",
  leave_group: "Salir del grupo",
  delete_group: "Eliminar grupo",
  archive: "Archivar",
  unarchive: "Desarchivar",
  hide: "Ocultar",
  unhide: "Mostrar",
  restore: "Restaurar",
  delete_hard_note: "Se eliminará permanentemente",
  delete_soft_note: "Se eliminará con opción de restaurar",
  delete_forbidden_debts_note: "No se puede eliminar: hay deudas pendientes",
  archive_forbidden_debts_note: "No se puede archivar: hay deudas pendientes",

  /* =============================
   * Página del grupo — pestañas
   * ============================= */
  group_tab_transactions: "Transacciones",
  group_tab_balance: "Balance",
  group_tab_analytics: "Analítica",

  /* =============================
   * Página del grupo — FAB y acciones rápidas
   * ============================= */
  add_transaction: "Agregar transacción",
  group_fab_add_transaction: "Agregar transacción",

  /* =============================
   * Pestaña «Balance»
   * ============================= */
  group_balance_microtab_mine: "Mi balance",
  group_balance_microtab_all: "Todos los balances",
  group_balance_no_debts: "Sin deudas",
  group_balance_get_from: "Te deben: {{sum}}",
  group_balance_owe_to: "Debes: {{sum}}",
  group_balance_no_debt_with: "Sin deuda",

  /* Previsualizaciones y totales */
  group_balance_you_get: "Te deben {{sum}}",
  group_balance_you_owe: "Debes {{sum}}",
  group_balance_he_get: "A él le deben {{sum}}",
  group_balance_he_owes: "Él debe {{sum}}",
  group_balance_zero: "Todo en cero",
  group_header_settings: "Ajustes",
  group_header_my_balance: "Mi balance",
  group_participant_no_debt: "Sin deuda",
  group_participant_you_owe: "Debes: {{sum}}",
  group_participant_owes_you: "Te deben: {{sum}}",

  /* Etiquetas cortas / estados vacíos */
  i_owe: "Yo debo",
  they_owe_me: "Me deben",
  group_balance_no_debts_left: "No le debo a nadie",
  group_balance_no_debts_right: "Nadie me debe",
  group_balance_no_debts_left_all: "Él no le debe a nadie",
  group_balance_no_debts_right_all: "Nadie le debe a él",
  group_balance_no_debts_all: "En el grupo nadie le debe a nadie",
  group_balance_totals_aria: "Totales por moneda",

  /* Botones expandir/contraer lista */
  expand_all: "Expandir todo",
  collapse_all: "Contraer todo",

  /* Botones dentro de tarjetas de deuda */
  repay_debt: "Pagar",
  remind_debt: "Recordar",

  /* =============================
   * Pestaña «Transacciones»
   * ============================= */
  group_transactions_empty: "Todavía no hay gastos — ¡agrega el primero!",
  group_transactions_not_found: "No se encontraron transacciones",
  group_transactions_placeholder:
    "Marcador de posición para la lista de transacciones. Aquí aparecerán las transacciones del grupo.",

  /* Modal de transacción */
  tx_modal: {
    title: "Nueva transacción",
    choose_group: "Elegir grupo",
    group_placeholder: "Elegir…",
    type: "Tipo",
    expense: "Gasto",
    transfer: "Transferencia",
    amount: "Importe",
    currency: "Moneda",
    date: "Fecha",
    comment: "Comentario",
    category: "Categoría",
    paid_by: "Pagado por",
    participants: "Participantes",
    split: "División",
    split_equal: "Equitativa",
    split_shares: "Por partes",
    split_custom: "Manual",
    transfer_from: "Remitente",
    transfer_to: "Destinatarios",
    cancel: "Cancelar",
    create: "Crear",
    next: "Siguiente",
    back: "Volver",
    choose_group_first: "Primero elige un grupo",

    amount_required: "Ingrese el importe",
    comment_required: "Ingrese el comentario",
    category_required: "Elija la categoría",
    split_no_participants: "Elija participantes",
    split_no_shares: "Partes no establecidas",
    split_custom_mismatch: "La suma por participante no coincide con el total",
    per_share: "Por 1 parte",
    custom_amounts_set: "Importes por participante establecidos",
    totals_mismatch: "Los totales no coinciden",
    each: "cada uno:",
    create_and_new: "Crear y nueva",

    all: "TODAS",
    paid_by_label: "Pagado por",
    owes_label: "Debe",
    owes: "debe",

    delete_confirm: "¿Eliminar esta transacción? Esta acción no se puede deshacer.",

    cannot_edit_or_delete_inactive:
      "No puedes editar o eliminar esta transacción porque uno de sus participantes salió del grupo.",
  },

  /* Tarjeta de transacción */
  tx_card: {
    not_participant_expense: "No eres participante de este gasto",
  },

  /* =============================
   * Pestaña «Analítica»
   * ============================= */
  group_analytics_coming_soon: "La analítica estará disponible pronto",

  /* =============================
   * Ajustes del grupo / miembros
   * ============================= */
  group_settings_tab_settings: "Ajustes",
  group_settings_tab_members: "Miembros",
  group_settings_leave_group: "Salir del grupo",
  group_settings_delete_group: "Eliminar grupo",
  group_members_invite: "Invitar",
  group_members_add: "Agregar",
  group_members_empty: "Aún no hay miembros",
  group_settings_close: "Cerrar",
  group_settings_save_and_exit: "Guardar y cerrar",
  group_settings_cancel_changes: "Cancelar cambios",

  /* Modales del grupo */
  group_modals: {
    archive_confirm: "¿Mover el grupo al archivo?",
    unarchive_confirm: "¿Restaurar el grupo del archivo?",
    delete_soft_confirm:
      "El grupo será eliminado. Si tiene transacciones, se podrá restaurar. Si no, se eliminará de forma permanente. ¿Continuar?",
    restore_confirm: "¿Restaurar el grupo eliminado?",
    edit_blocked_deleted: "El grupo está eliminado y no se puede editar. Restáuralo primero.",
    edit_blocked_archived:
      "El grupo está archivado y no se puede editar. Desarchívalo primero.",
  },

  /* =============================
   * Invitaciones
   * ============================= */
  create_invite_link: "Crear enlace de invitación",
  invite_by_link: "Invitar por enlace",
  copy_link: "Copiar enlace",
  copied: "¡Copiado!",
  share_link: "Compartir (en Telegram)",
  share: "Compartir",
  shared: "¡El enlace está listo para pegar!",
  invite_friend: "Invitar a un amigo",
  invite_error: "No se pudo crear el enlace. Inténtalo más tarde.",
  invite_message:
    "Únete a mí en Splitto — una forma sencilla de gestionar gastos compartidos sin salir de Telegram.\nAquí tienes el enlace de invitación:\n{{link}}",
  error_invite_link: "No se pudo obtener el enlace",

  /* =============================
   * Contactos / búsqueda / lista
   * ============================= */
  empty_contacts: "Aún no tienes contactos...",
  contacts_count: "Contactos totales: {{count}}",
  search_placeholder: "Buscar contacto...",
  filter: "Filtro",
  sort: "Ordenar",
  no_friends: "No hay amigos para agregar",

  /* Página de contacto */
  contact: {
    tab_info: "Información",
    tab_contact_friends: "Amigos",
    in_friends_since: "Amigos desde",
    open_in_telegram: "Abrir contacto en Telegram",
    mutual_groups: "Grupos en común",
    no_common_groups: "No hay grupos en común",
    loading: "Cargando…",
    error_contact: "No se pudo cargar el contacto",
    error_common_groups: "No se pudieron cargar los grupos en común",
    error_contact_friends: "No se pudieron cargar los amigos del contacto",
    error_friends_list: "No se pudo cargar la lista de amigos",
    shown_of_total: "{{shown}} de {{total}}",
    no_name: "Sin nombre",
  },

  /* =============================
   * Filtros / orden de grupos
   * ============================= */
  groups_filter_title: "Filtro de grupos",
  groups_filter_status: "Estado",
  groups_filter_status_active: "Activos",
  groups_filter_status_archived: "Archivados",
  groups_filter_status_deleted: "Eliminados",
  groups_filter_hidden: "Ocultados por mí",
  groups_filter_hidden_hidden: "Ocultos",
  groups_filter_hidden_visible: "Visibles",
  groups_filter_activity: "Actividad",
  groups_filter_activity_recent: "Reciente",
  groups_filter_activity_inactive: "Inactiva",
  groups_filter_activity_empty: "Sin transacciones",
  groups_filter_all: "TODOS",
  groups_sort_title: "Ordenar",
  groups_sort_by: "Ordenar por",
  groups_sort_by_last_activity: "Última actividad",
  groups_sort_by_name: "Nombre",
  groups_sort_by_created_at: "Fecha de creación",
  groups_sort_by_members_count: "Número de miembros",
  groups_sort_dir: "Dirección",
  groups_sort_dir_asc: "Ascendente",
  groups_sort_dir_desc: "Descendente",

  /* =============================
   * Restricciones / advertencias
   * ============================= */
  group_settings_cannot_leave_due_debt:
    "No puedes abandonar este grupo ahora porque tienes deudas pendientes con otros miembros. Liquida todas las deudas e inténtalo de nuevo.",
  cannot_edit_or_delete_inactive:
    "No puedes editar o eliminar esta transacción porque uno de sus participantes salió del grupo.",

  /* =============================
   * Modal de recordatorio
   * ============================= */
  reminder_copied_title: "Texto copiado",
  reminder_copied_desc: "Abre el contacto en Telegram y pega.",
};
