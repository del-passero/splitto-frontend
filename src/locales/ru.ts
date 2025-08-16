// src/i18n/ru.ts
export default {
  // --- Навигация и основные разделы ---
  main: "Главная",
  groups: "Группы",
  group: "Группа",
  create_group: "Создать группу",
  add_transaction: "Добавить транзакцию",
  edit_group: "Редактировать группу",
  no_groups: "Нет групп",
  contacts: "Контакты",
  profile: "Профиль",

  // --- Группы и участники ---
  participants: "Участники",
  members: "Участники",
  owner: "Создатель",
  no_participants: "Нет участников",
  contacts_not_found: "Не найдено ни одного контакта",
  groups_not_found: "Не найдено ни одной группы",
  group_name_placeholder: "Название группы",
  group_description_placeholder: "Описание группы",
  group_name_required: "Введите название группы",
  error_create_group: "Ошибка при создании группы",
  error_edit_group: "Ошибка при редактировании группы",
  saving: "Сохранение...",
  add_participants: "Добавить участников",
  empty_members: "Нет участников",
  groups_count: "Всего групп: {{count}}",
  groups_top_info: "У вас {{count}} активных групп",
  empty_groups: "У вас ещё нет ни одной группы",
  empty_groups_hint: "Создайте свою первую группу для управления совместными расходами!",
  search_group_placeholder: "Поиск группы...",
  debts_reserved: "Долги — скоро!",
  and_more_members: "и ещё {{count}}",
  group_members_count: "{{count}} участников",
  group_status_archived: "Архив",
  leave_group: "Выйти из группы",
  delete_group: "Удалить группу",

  // --- Балансы и долги ---
  group_balance_you_get: "Тебе должны {{sum}} ₽",
  group_balance_you_owe: "Ты должен {{sum}} ₽",
  group_balance_zero: "Всё по нулям",
  group_header_settings: "Настройки",
  group_header_my_balance: "Мой баланс",
  group_participant_no_debt: "Нет долга",
  group_participant_you_owe: "Вы должны: {{sum}} ₽",
  group_participant_owes_you: "Вам должны: {{sum}} ₽",

  // --- Список участников (скролл) ---
  group_invite: "Пригласить",
  group_add_member: "Добавить",

  // --- Вкладки группы ---
  group_tab_transactions: "Транзакции",
  group_tab_balance: "Баланс",
  group_tab_analytics: "Аналитика",

  // --- FAB ---
  group_fab_add_transaction: "Добавить транзакцию",

  // --- Транзакции ---
  group_transactions_empty: "В группе пока нет трат — добавьте первую!",
  group_transactions_not_found: "Траты не найдены",
  group_transactions_placeholder:
    "Заглушка для списка транзакций. Тут появятся транзакции вашей группы.",

  // --- Вкладка Баланс ---
  group_balance_microtab_mine: "Мой баланс",
  group_balance_microtab_all: "Все балансы",
  group_balance_no_debts: "Нет долгов",
  group_balance_get_from: "Вам должны: {{sum}} ₽",
  group_balance_owe_to: "Вы должны: {{sum}} ₽",
  group_balance_no_debt_with: "Нет долга",
  group_balance_no_debts_all: "В группе никто никому не должен",

  // --- Вкладка Аналитика ---
  group_analytics_coming_soon: "Аналитика скоро появится",

  // --- Страница настроек группы ---
  group_settings_tab_settings: "Настройки",
  group_settings_tab_members: "Участники",
  group_settings_leave_group: "Выйти из группы",
  group_settings_delete_group: "Удалить группу",
  group_members_invite: "Пригласить",
  group_members_add: "Добавить",
  group_members_empty: "В группе пока нет участников",
  group_settings_close: "Закрыть",
  group_settings_save_and_exit: "Сохранить и закрыть",

  // --- Приглашения (инвайты) ---
  create_invite_link: "Создать ссылку-приглашение",
  invite_by_link: "Пригласить по ссылке",
  copy_link: "Скопировать ссылку",
  copied: "Скопировано!",
  share_link: "Поделиться (в Telegram)",
  share: "Поделиться",
  shared: "Ссылка готова для вставки!",
  invite_friend: "Пригласить друга",
  invite_error: "Не удалось создать ссылку. Попробуйте позже.",
  invite_message:
    "Присоединяйся ко мне в Splitto — удобный способ управлять совместными расходами не выходя из Telegram.\nВот ссылка для входа:\n{{link}}",
  error_invite_link: "Не удалось получить ссылку",

  // --- Контакты ---
  empty_contacts: "У вас ещё нет ни одного контакта...",
  contacts_count: "Всего контактов: {{count}}",
  search_placeholder: "Поиск контакта...",
  filter: "Фильтр",
  sort: "Сортировка",
  no_friends: "Нет друзей для добавления",

  // --- Профиль и настройки ---
  account: "Аккаунт",
  settings: "Настройки",
  about: "О приложении",
  theme: "Тема",
  choose_theme: "Выберите тему",
  language: "Язык",
  choose_language: "Выберите язык",
  not_specified: "Не указано",
  theme_auto: "Системная",
  theme_light: "Светлая",
  theme_dark: "Тёмная",
  language_auto: "Системный",
  language_ru: "Русский",
  language_en: "Английский",
  language_es: "Испанский",
  version: "Версия",

  // --- Кнопки и статусы ---
  edit: "Редактировать",
  cancel: "Отмена",
  save: "Сохранить",
  close: "Закрыть",
  loading: "Загрузка...",

  // --- Ошибки и системные статусы ---
  error: "Ошибка",
  group_settings_cannot_leave_due_debt:
    "Сейчас Вы не можете покинуть эту группу, поскольку у вас есть непогашенные долги перед другими участниками группы. Пожалуйста, убедитесь, что все ваши долги погашены, и повторите попытку",

  // --- Валюты ---
  currency: {
    select_title: "Выбор валюты",
    search_placeholder: "Поиск валюты",
    not_found: "Ничего не найдено",
    main_currency: "Основная валюта",
    select_short: "Выберите валюту",
    currency_popular: "Популярные",
  },

  // --- Общие и форма группы ---
  common: { yes: "Да", no: "Нет" },
  errors: {
    group_name_required: "Введите название группы",
    group_trip_date_required: "Укажите дату поездки",
    create_group_failed: "Не удалось создать группу",
  },
  group_form: {
    name_placeholder: "Название группы",
    description_placeholder: "Описание группы",
    is_trip: "Группа для путешествия?",
    trip_date:
      "Введите дату, после которой группа (при условии отсутствия долгов) автоматически переместится в архив",
    name_hint_initial: "Введите название группы (до {{max}} символов)",
    name_hint_remaining: "Осталось {{n}} символов",
    desc_hint_initial: "Введите описание группы (до {{max}} символов)",
    desc_hint_remaining: "Осталось {{n}} символов",
    trip_date_placeholder: "ДД.ММ.ГГГГ",
  },

  // --- Модалка добавления участников ---
  add_members_modal: {
    title: "Добавить участников",
    search_placeholder: "Поиск контакта...",
    empty: "Нет друзей для добавления",
    add_btn: "Добавить ({{count}})",
    adding: "Добавление...",
    error_some_failed: "Добавлено: {{added}}, не удалось: {{failed}}",
  },

  // --- Модалка транзакций ---
  tx_modal: {
    title: "Новая транзакция",
    choose_group: "Выберите группу",
    group_placeholder: "Выберите…",
    type: "Тип",
    expense: "Расход",
    transfer: "Перевод",
    amount: "Сумма",
    currency: "Валюта",
    date: "Дата",
    comment: "Комментарий",
    category: "Категория",
    paid_by: "Кто платил",
    participants: "Участники",
    split: "Деление",
    split_equal: "Поровну",
    split_shares: "По долям",
    split_custom: "Вручную",
    transfer_from: "Отправитель",
    transfer_to: "Получатели",
    cancel: "Отмена",
    create: "Создать",
    next: "Далее",
    back: "Назад",
    choose_group_first: "Сначала выберите группу",

    // UI
    create_and_new: "Создать и новую",
    all: "ВСЕ",
    each: "по",
    total_shares: "Всего долей",
    per_share: "доля",
    custom_amounts_set: "Суммы заданы вручную",
    totals_mismatch: "Суммы не совпадают",

    // Errors / validation
    amount_required: "Введите сумму больше 0",
    comment_required: "Заполните комментарий",
    category_required: "Выберите категорию",
    split_no_participants: "Выберите хотя бы одного участника",
    split_no_shares: "Сумма долей должна быть больше нуля",
    split_custom_no_values: "Введите суммы для участников",
    split_custom_mismatch: "Суммы участников должны равняться общей сумме",
  },

  // --- Категории ---
  category: {
    select_title: "Выбор категории",
    search_placeholder: "Поиск категории",
    not_found: "Ничего не найдено",
  },
};
