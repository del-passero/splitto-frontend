// src/locales/en.ts
export default {
  // --- Navigation ---
  main: "Home",
  groups: "Groups",
  group: "Group",
  create_group: "Create group",
  add_transaction: "Add transaction",
  edit_group: "Edit group",
  no_groups: "No groups",
  contacts: "Contacts",
  profile: "Profile",

  // --- Groups & members ---
  participants: "Participants",
  members: "Members",
  owner: "Owner",
  no_participants: "No participants",
  contacts_not_found: "No contacts found",
  groups_not_found: "No groups found",
  group_name_placeholder: "Group name",
  group_description_placeholder: "Group description",
  group_name_required: "Enter a group name",
  error_create_group: "Failed to create group",
  error_edit_group: "Failed to edit group",
  saving: "Saving...",
  add_participants: "Add participants",
  empty_members: "No members",
  groups_count: "Total groups: {{count}}",
  groups_top_info: "You have {{count}} active groups",
  empty_groups: "You don't have any groups yet",
  empty_groups_hint:
    "Create your first group to manage shared expenses!",
  search_group_placeholder: "Search group...",
  debts_reserved: "Debts — soon!",
  and_more_members: "and {{count}} more",
  group_members_count: "{{count}} members",
  group_status_archived: "Archived",
  leave_group: "Leave group",
  delete_group: "Delete group",

  // --- Balances ---
  group_balance_you_get: "You should receive {{sum}} ?",
  group_balance_you_owe: "You owe {{sum}} ?",
  group_balance_zero: "All settled",
  group_header_settings: "Settings",
  group_header_my_balance: "My balance",
  group_participant_no_debt: "No debt",
  group_participant_you_owe: "You owe: {{sum}} ?",
  group_participant_owes_you: "Owes you: {{sum}} ?",

  // --- Members scroll ---
  group_invite: "Invite",
  group_add_member: "Add",

  // --- Tabs ---
  group_tab_transactions: "Transactions",
  group_tab_balance: "Balance",
  group_tab_analytics: "Analytics",

  // --- FAB ---
  group_fab_add_transaction: "Add transaction",

  // --- Transactions ---
  group_transactions_empty: "No expenses yet — add the first one!",
  group_transactions_not_found: "No expenses found",
  group_transactions_placeholder:
    "Placeholder for the transaction list. Your group's expenses will appear here.",

  // --- Balance tab ---
  group_balance_microtab_mine: "My balance",
  group_balance_microtab_all: "All balances",
  group_balance_no_debts: "No debts",
  group_balance_get_from: "You should receive: {{sum}} ?",
  group_balance_owe_to: "You owe: {{sum}} ?",
  group_balance_no_debt_with: "No debt",
  group_balance_no_debts_all: "No one owes anyone in this group",

  // --- Analytics tab ---
  group_analytics_coming_soon: "Analytics coming soon",

  // --- Group settings page ---
  group_settings_tab_settings: "Settings",
  group_settings_tab_members: "Members",
  group_settings_leave_group: "Leave group",
  group_settings_delete_group: "Delete group",
  group_members_invite: "Invite",
  group_members_add: "Add",
  group_members_empty: "No members yet",
  group_settings_close: "Close",
  group_settings_save_and_exit: "Save & close",

  // --- Invites ---
  create_invite_link: "Create invite link",
  invite_by_link: "Invite by link",
  copy_link: "Copy link",
  copied: "Copied!",
  share_link: "Share (Telegram)",
  share: "Share",
  shared: "Link ready to paste!",
  invite_friend: "Invite a friend",
  invite_error: "Failed to create link. Try again later.",
  invite_message:
    "Join me in Splitto — the easy way to manage shared expenses without leaving Telegram.\nHere's your invite link:\n{{link}}",
  error_invite_link: "Failed to get link",

  // --- Contacts ---
  empty_contacts: "You don't have any contacts yet...",
  contacts_count: "Total contacts: {{count}}",
  search_placeholder: "Search contact...",
  filter: "Filter",
  sort: "Sort",
  no_friends: "No friends to add",

  // --- Profile & settings ---
  account: "Account",
  settings: "Settings",
  about: "About",
  theme: "Theme",
  choose_theme: "Choose a theme",
  language: "Language",
  choose_language: "Choose a language",
  not_specified: "Not specified",
  theme_auto: "System",
  theme_light: "Light",
  theme_dark: "Dark",
  language_auto: "System",
  language_ru: "Russian",
  language_en: "English",
  language_es: "Spanish",
  version: "Version",

  // --- Buttons & statuses ---
  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  loading: "Loading...",

  // --- Errors ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "You can't leave this group right now because you have outstanding debts to other members. Please settle all debts and try again.",

  // --- Currency ---
  currency: {
    select_title: "Choose currency",
    search_placeholder: "Search currency",
    not_found: "Nothing found",
    main_currency: "Main currency",
    select_short: "Select currency",
    currency_popular: "Popular",
  },

  // --- Common & group form ---
  common: {
    yes: "Yes",
    no: "No",
  },
  errors: {
    group_name_required: "Enter a group name",
    group_trip_date_required: "Specify a trip date",
    create_group_failed: "Couldn't create group",
  },
  group_form: {
    name_placeholder: "Group name",
    description_placeholder: "Group description",
    is_trip: "Is this a trip group?",
    trip_date:
      "Enter a date after which the group (if there are no debts) will be archived automatically",
    name_hint_initial: "Enter group name (up to {{max}} chars)",
    name_hint_remaining: "{{n}} chars left",
    desc_hint_initial: "Enter description (up to {{max}} chars)",
    desc_hint_remaining: "{{n}} chars left",
    trip_date_placeholder: "DD.MM.YYYY",
  },

  // --- Add members modal ---
  add_members_modal: {
    title: "Add members",
    search_placeholder: "Search contact...",
    empty: "No friends to add",
    add_btn: "Add ({{count}})",
    adding: "Adding...",
    error_some_failed: "Added: {{added}}, failed: {{failed}}",
  },

  // --- Transaction modal ---
  tx_modal: {
    title: "New transaction",
    choose_group: "Choose group",
    group_placeholder: "Select…",
    type: "Type",
    expense: "Expense",
    transfer: "Transfer",
    amount: "Amount",
    currency: "Currency",
    date: "Date",
    comment: "Comment",
    category: "Category",
    paid_by: "Paid by",
    participants: "Participants",
    split: "Split",
    split_equal: "Equal",
    split_shares: "Shares",
    split_custom: "Custom",
    transfer_from: "Sender",
    transfer_to: "Receivers",
    cancel: "Cancel",
    create: "Create",
    next: "Next",
    back: "Back",
    choose_group_first: "Choose a group first",

    amount_required: "Enter amount",
    comment_required: "Enter a comment",
    category_required: "Choose a category",
    split_no_participants: "Select participants",
    split_no_shares: "No shares set",
    split_custom_mismatch: "Participants total doesn't equal overall",
    per_share: "Per share",
    custom_amounts_set: "Custom amounts set",
    totals_mismatch: "Totals mismatch",
    each: "each:",
    create_and_new: "Create and add another",

    // NEW
    all: "ALL",
    paid_by_label: "Paid by",
    owes_label: "Owes",
  },

  // --- Categories ---
  category: {
    select_title: "Choose category",
    search_placeholder: "Search category",
    not_found: "Nothing found",
  },
};
