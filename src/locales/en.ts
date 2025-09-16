// src/locales/en.ts
export default {
  // --- Navigation & sections ---
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
  no_participants: "No members",
  contacts_not_found: "No contacts found",
  groups_not_found: "No groups found",
  group_name_placeholder: "Group name",
  group_description_placeholder: "Description",
  group_name_required: "Enter a group name",
  error_create_group: "Failed to create group",
  error_edit_group: "Failed to edit group",
  saving: "Saving...",
  add_participants: "Add participants",
  empty_members: "No members",
  groups_count: "Total groups: {{count}}",
  groups_top_info: "You have {{count}} active groups",
  empty_groups: "You don’t have any groups yet",
  empty_groups_hint:
    "Create your first group to manage shared expenses right inside Telegram.",
  search_group_placeholder: "Search group...",
  debts_reserved: "Debts — coming soon!",
  and_more_members: "and {{count}} more",
  group_members_count: "{{count}} members",
  group_status_archived: "Archive",
  leave_group: "Leave group",
  delete_group: "Delete group",

  // --- Balances ---
  group_balance_you_get: "You are owed {{sum}}",
  group_balance_you_owe: "You owe {{sum}}",
  group_balance_zero: "All settled",
  group_header_settings: "Settings",
  group_header_my_balance: "My balance",
  group_participant_no_debt: "No debt",
  group_participant_you_owe: "You owe: {{sum}}",
  group_participant_owes_you: "Owes you: {{sum}}",

  // --- Members scroller ---
  group_invite: "Invite",
  group_add_member: "Add",

  // --- Group tabs ---
  group_tab_transactions: "Transactions",
  group_tab_balance: "Balance",
  group_tab_analytics: "Analytics",

  // --- FAB ---
  group_fab_add_transaction: "Add transaction",

  // --- Transactions ---
  group_transactions_empty: "No expenses in this group yet — add the first one!",
  group_transactions_not_found: "No expenses found",
  group_transactions_placeholder:
    "A placeholder for the transactions list. Your group’s transactions will appear here.",

  // --- Balance tab ---
  group_balance_microtab_mine: "My balance",
  group_balance_microtab_all: "All balances",
  group_balance_no_debts: "No debts",
  group_balance_get_from: "Owes you: {{sum}}",
  group_balance_owe_to: "You owe: {{sum}}",
  group_balance_no_debt_with: "No debt",
  group_balance_no_debts_all: "Nobody owes anyone in this group",

  // Action labels on balance cards
  repay_debt: "Settle up",
  remind_debt: "Send reminder",

  // --- Analytics tab ---
  group_analytics_coming_soon: "Analytics coming soon",

  // --- Group settings page ---
  group_settings_tab_settings: "Settings",
  group_settings_tab_members: "Members",
  group_settings_leave_group: "Leave group",
  group_settings_delete_group: "Delete group",
  group_members_invite: "Invite",
  group_members_add: "Add",
  group_members_empty: "This group has no members yet",
  group_settings_close: "Close",
  group_settings_save_and_exit: "Save & close",
  group_settings_cancel_changes: "Discard changes",

  // --- Invites ---
  create_invite_link: "Create invite link",
  invite_by_link: "Invite via link",
  copy_link: "Copy link",
  copied: "Copied!",
  share_link: "Share (in Telegram)",
  share: "Share",
  shared: "The link is ready to paste!",
  invite_friend: "Invite a friend",
  invite_error: "Couldn’t create the link. Please try again later.",
  invite_message:
    "Join me on Splitto — an easy way to manage shared expenses right inside Telegram.\nHere’s your invite link:\n{{link}}",
  error_invite_link: "Failed to fetch invite link",

  // --- Contacts ---
  empty_contacts: "You don’t have any contacts yet...",
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
  choose_theme: "Choose theme",
  language: "Language",
  choose_language: "Choose language",
  not_specified: "Not set",
  theme_auto: "From Telegram",
  theme_light: "Light",
  theme_dark: "Dark",
  language_auto: "From Telegram",
  language_ru: "Russian",
  language_en: "English",
  language_es: "Spanish",
  version: "Version",

  // --- Buttons & statuses ---
  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  delete: "Delete",
  loading: "Loading...",
  save_failed: "Failed to save",
  delete_failed: "Failed to delete",

  // --- Errors & system ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "You can’t leave this group right now because you have outstanding debts to other members. Please settle your debts and try again.",

  // --- Currencies ---
  currency: {
    select_title: "Choose currency",
    search_placeholder: "Search currency",
    not_found: "Nothing found",
    main_currency: "Main currency",
    select_short: "Select currency",
    currency_popular: "Popular",
  },

  // --- Common / forms ---
  common: { yes: "Yes", no: "No" },
  errors: {
    group_name_required: "Enter a group name",
    group_trip_date_required: "Specify a trip date",
    create_group_failed: "Failed to create group",
    friends_load: "Failed to load friends",
    friends_search: "Search failed",
    contact_load: "Failed to load contact",
    common_groups_load: "Failed to load mutual groups",
    contact_friends_load: "Failed to load contact’s friends",
    tx_delete_forbidden_expense:
      "Only the author or the payer can delete an expense",
    tx_delete_forbidden_transfer:
      "Only the author or the sender can delete a transfer",
    delete_forbidden:
      "Only the author or payer/sender can delete this transaction",
  },

  group_form: {
    name_placeholder: "Group name",
    description_placeholder: "Description",
    is_trip: "Is this a trip group?",
    trip_date:
      "Enter a date after which the group will move to Archive (if no debts remain)",
    name_hint_initial: "Enter a name (up to {{max}} chars)",
    name_hint_remaining: "{{n}} characters left",
    desc_hint_initial: "Enter a description (up to {{max}} chars)",
    desc_hint_remaining: "{{n}} characters left",
    trip_date_placeholder: "DD.MM.YYYY",
  },

  // --- Modals ---
  add_members_modal: {
    title: "Add participants",
    search_placeholder: "Search contact...",
    empty: "No friends to add",
    add_btn: "Add ({{count}})",
    adding: "Adding...",
    error_some_failed: "Added: {{added}}, failed: {{failed}}",
  },

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
    split_equal: "Equally",
    split_shares: "By shares",
    split_custom: "Custom",
    transfer_from: "Sender",
    transfer_to: "Recipients",
    cancel: "Cancel",
    create: "Create",
    next: "Next",
    back: "Back",
    choose_group_first: "Choose a group first",

    amount_required: "Enter the amount",
    comment_required: "Enter a comment",
    category_required: "Choose a category",
    split_no_participants: "Select participants",
    split_no_shares: "No shares specified",
    split_custom_mismatch: "Participants total doesn’t match the amount",
    per_share: "Per 1 share",
    custom_amounts_set: "Custom amounts set",
    totals_mismatch: "Totals don’t match",
    each: "each:",
    create_and_new: "Create and new",

    all: "ALL",
    paid_by_label: "Paid by",
    owes_label: "Owes",
    owes: "owes",

    delete_confirm: "Delete this transaction? This action cannot be undone.",

    cannot_edit_or_delete_inactive:
      "You can't edit or delete this transaction because one of its participants has left the group.",
  },

  // --- Transaction card ---
  tx_card: {
    not_participant_expense: "You are not a participant of this expense",
  },

  // --- Categories ---
  category: {
    select_title: "Choose category",
    search_placeholder: "Search category",
    not_found: "Nothing found",
  },

  // --- Date on cards ---
  date_card: {
    pattern: "{{day}} {{month}}",
    months: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
  },

  actions: "Actions",

  // --- Contact page ---
  contact: {
    tab_info: "Contact info",
    tab_contact_friends: "Contact’s friends",
    in_friends_since: "Friends since",
    open_in_telegram: "Open in Telegram",
    mutual_groups: "Mutual groups",
    no_common_groups: "No mutual groups",
    loading: "Loading…",
    error_contact: "Failed to load contact",
    error_common_groups: "Failed to load mutual groups",
    error_contact_friends: "Failed to load contact’s friends",
    error_friends_list: "Failed to load friends list",
    shown_of_total: "{{shown}} of {{total}}",
    no_name: "No name",
  },

  // --- Alias for convenient access in code ---
  cannot_edit_or_delete_inactive:
    "You can't edit or delete this transaction because one of its participants has left the group.",
}
