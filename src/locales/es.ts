export default {
  // Navegación
  main: "Inicio",
  groups: "Grupos",
  group: "Grupo",
  create_group: "Crear grupo",
  add_transaction: "Añadir gasto",
  edit_group: "Editar grupo",
  no_groups: "No hay grupos",
  contacts: "Contactos",
  profile: "Perfil",

  // Grupos y miembros
  participants: "Participantes",
  members: "Miembros",
  owner: "Creador",
  no_participants: "Sin miembros",
  contacts_not_found: "No se encontraron contactos",
  groups_not_found: "No se encontraron grupos",
  group_name_placeholder: "Nombre del grupo",
  group_description_placeholder: "Descripción",
  group_name_required: "Introduce el nombre del grupo",
  error_create_group: "Error al crear el grupo",
  error_edit_group: "Error al editar el grupo",
  saving: "Guardando...",
  add_participants: "Agregar participantes",
  empty_members: "Sin miembros",
  groups_count: "Total de grupos: {{count}}",
  groups_top_info: "Tienes {{count}} grupos activos",
  empty_groups: "Aún no tienes grupos",
  empty_groups_hint: "¡Crea tu primer grupo para gestionar gastos compartidos!",
  search_group_placeholder: "Buscar grupo...",
  debts_reserved: "Deudas — ¡pronto!",
  and_more_members: "y {{count}} más",
  group_members_count: "{{count}} miembros",
  group_status_archived: "Archivado",
  leave_group: "Salir del grupo",
  delete_group: "Eliminar grupo",

  // Saldos
  group_balance_you_get: "Te deben {{sum}} ₽",
  group_balance_you_owe: "Debes {{sum}} ₽",
  group_balance_zero: "Todo en cero",
  group_header_settings: "Ajustes",
  group_header_my_balance: "Mi saldo",
  group_participant_no_debt: "Sin deuda",
  group_participant_you_owe: "Debes: {{sum}}",
  group_participant_owes_you: "Te deben: {{sum}}",

  // Lista
  group_invite: "Invitar",
  group_add_member: "Agregar",

  // Pestañas
  group_tab_transactions: "Transacciones",
  group_tab_balance: "Saldo",
  group_tab_analytics: "Analítica",

  // FAB
  group_fab_add_transaction: "Añadir gasto",

  // Transacciones
  group_transactions_empty: "Aún no hay gastos — ¡añade el primero!",
  group_transactions_not_found: "No se encontraron gastos",
  group_transactions_placeholder:
    "Marcador de transacciones. Aquí aparecerán las transacciones del grupo.",

  // Pestaña Saldo
  group_balance_microtab_mine: "Mi saldo",
  group_balance_microtab_all: "Todos",
  group_balance_no_debts: "Sin deudas",
  group_balance_get_from: "Te deben: {{sum}} ₽",
  group_balance_owe_to: "Debes: {{sum}} ₽",
  group_balance_no_debt_with: "Sin deuda",
  group_balance_no_debts_all: "En el grupo nadie debe a nadie",

  // Analítica
  group_analytics_coming_soon: "La analítica llegará pronto",

  // Página de ajustes del grupo
  group_settings_tab_settings: "Ajustes",
  group_settings_tab_members: "Miembros",
  group_settings_leave_group: "Salir del grupo",
  group_settings_delete_group: "Eliminar grupo",
  group_members_invite: "Invitar",
  group_members_add: "Agregar",
  group_members_empty: "Aún no hay miembros",
  group_settings_close: "Cerrar",
  group_settings_save_and_exit: "Guardar y cerrar",

  // Invitaciones
  create_invite_link: "Crear enlace de invitación",
  invite_by_link: "Invitar por enlace",
  copy_link: "Copiar enlace",
  copied: "¡Copiado!",
  share_link: "Compartir (en Telegram)",
  share: "Compartir",
  shared: "¡Enlace listo para pegar!",
  invite_friend: "Invitar a un amigo",
  invite_error: "No se pudo crear el enlace. Inténtalo más tarde.",
  invite_message:
    "Únete a mí en Splitto — una forma cómoda de gestionar gastos compartidos en Telegram.\nEnlace de acceso:\n{{link}}",
  error_invite_link: "No se pudo obtener el enlace",

  // Contactos
  empty_contacts: "Aún no tienes contactos...",
  contacts_count: "Contactos: {{count}}",
  search_placeholder: "Buscar contacto...",
  filter: "Filtro",
  sort: "Ordenar",
  no_friends: "No hay amigos para agregar",

  // Perfil y ajustes
  account: "Cuenta",
  settings: "Ajustes",
  about: "Acerca de",
  theme: "Tema",
  choose_theme: "Elige un tema",
  language: "Idioma",
  choose_language: "Elige un idioma",
  not_specified: "No especificado",
  theme_auto: "Sistema",
  theme_light: "Claro",
  theme_dark: "Oscuro",
  language_auto: "Sistema",
  language_ru: "Ruso",
  language_en: "Inglés",
  language_es: "Español",
  version: "Versión",

  // Botones y estados
  edit: "Editar",
  cancel: "Cancelar",
  save: "Guardar",
  close: "Cerrar",
  delete: "Eliminar",
  loading: "Cargando...",
  save_failed: "No se pudo guardar",
  delete_failed: "No se pudo eliminar",

  // Errores
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "No puedes salir del grupo porque tienes deudas pendientes. Liquídalas e inténtalo de nuevo.",

  // Monedas
  currency: {
    select_title: "Elegir moneda",
    search_placeholder: "Buscar moneda",
    not_found: "No se encontró nada",
    main_currency: "Moneda principal",
    select_short: "Elegir moneda",
    currency_popular: "Populares",
  },

  // Varios / formulario de grupo
  common: { yes: "Sí", no: "No" },
  errors: {
    group_name_required: "Introduce el nombre del grupo",
    group_trip_date_required: "Indica la fecha del viaje",
    create_group_failed: "No se pudo crear el grupo",
  },
  group_form: {
    name_placeholder: "Nombre del grupo",
    description_placeholder: "Descripción",
    is_trip: "¿Grupo de viaje?",
    trip_date:
      "Introduce la fecha a partir de la cual el grupo (si no hay deudas) pasará al archivo automáticamente",
    name_hint_initial: "Introduce el nombre (hasta {{max}} caracteres)",
    name_hint_remaining: "Quedan {{n}} caracteres",
    desc_hint_initial: "Introduce la descripción (hasta {{max}} caracteres)",
    desc_hint_remaining: "Quedan {{n}} caracteres",
    trip_date_placeholder: "DD.MM.AAAA",
  },

  // Modal para agregar miembros
  add_members_modal: {
    title: "Agregar participantes",
    search_placeholder: "Buscar contacto...",
    empty: "No hay amigos para agregar",
    add_btn: "Agregar ({{count}})",
    adding: "Agregando...",
    error_some_failed: "Agregados: {{added}}, fallidos: {{failed}}",
  },

  // Modal de transacción
  tx_modal: {
    title: "Nueva transacción",
    choose_group: "Elige un grupo",
    group_placeholder: "Elegir…",
    type: "Tipo",
    expense: "Gasto",
    transfer: "Transferencia",
    amount: "Importe",
    currency: "Moneda",
    date: "Fecha",
    comment: "Comentario",
    category: "Categoría",
    paid_by: "Pagó",
    participants: "Participantes",
    split: "Reparto",
    split_equal: "Por igual",
    split_shares: "Por participaciones",
    split_custom: "Manual",
    transfer_from: "Remitente",
    transfer_to: "Destinatarios",
    cancel: "Cancelar",
    create: "Crear",
    next: "Siguiente",
    back: "Atrás",
    choose_group_first: "Primero elige un grupo",

    amount_required: "Introduce un importe",
    comment_required: "Introduce un comentario",
    category_required: "Elige una categoría",
    split_no_participants: "Elige participantes",
    split_no_shares: "Participaciones no definidas",
    split_custom_mismatch: "La suma por participantes no coincide con el total",
    per_share: "Por 1 participación",
    custom_amounts_set: "Importes personalizados establecidos",
    totals_mismatch: "Los totales no cuadran",
    each: "cada uno:",
    create_and_new: "Crear y nueva",

    all: "TODOS",
    paid_by_label: "Pagó",
    owes_label: "Debe",

    delete_confirm: "¿Eliminar la transacción? Esta acción es irreversible.",
  },

  // Categorías
  category: {
    select_title: "Elegir categoría",
    search_placeholder: "Buscar categoría",
    not_found: "No se encontró nada",
  },

  // Fecha para la tarjeta (meses cortos)
  date_card: {
    pattern: "{{day}} {{month}}",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  },

  actions: "Acciones",
};
