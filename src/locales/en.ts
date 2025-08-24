export default {
  // --- Navigation & main ---
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
  group_description_placeholder: "Description",
  group_name_required: "Enter a group name",
  error_create_group: "Error creating group",
  error_edit_group: "Error editing group",
  saving: "Saving...",
  add_participants: "Add participants",
  empty_members: "No members",
  groups_count: "Total groups: {{count}}",
  groups_top_info: "You have {{count}} active groups",
  empty_groups: "You don't have any groups yet",
  empty_groups_hint:
    "Create your first group to manage shared expenses!",
  search_group_placeholder: "Search group...",
  debts_reserved: "Debts — coming soon!",
  and_more_members: "and {{count}} more",
  group_members_count: "{{count}} members",
  group_status_archived: "Archived",
  leave_group: "Leave group",
  delete_group: "Delete group",

  // --- Balances & debts ---
  group_balance_you_get: "You are owed {{sum}} ?",
  group_balance_you_owe: "You owe {{sum}} ?",
  group_balance_zero: "All settled",
  group_header_settings: "Settings",
  group_header_my_balance: "My balance",
  group_participant_no_debt: "No debt",
  // no currency symbol here:
  group_participant_you_owe: "You owe: {{sum}}",
  group_participant_owes_you: "They owe you: {{sum}}",

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
  group_transactions_empty: "No expenses yet — add the first one!",
  group_transactions_not_found: "No expenses found",
  group_transactions_placeholder:
    "Placeholder for group transactions. Your group's transactions will appear here.",

  // --- Balance tab ---
  group_balance_microtab_mine: "My balance",
  group_balance_microtab_all: "All balances",
  group_balance_no_debts: "No debts",
  group_balance_get_from: "You are owed: {{sum}} ?",
  group_balance_owe_to: "You owe: {{sum}} ?",
  group_balance_no_debt_with: "No debt",
  group_balance_no_debts_all: "Nobody owes anyone in this group",

  // --- Analytics tab ---
  group_analytics_coming_soon: "Analytics coming soon",

  // --- Group settings page ---
  group_settings_tab_settings: "Settings",
  group_settings_tab_members: "Members",
  group_settings_leave_group: "Leave group",
  group_settings_delete_group: "Delete group",
  group_members_invite: "Invite",
  group_members_add: "Add",
  group_members_empty: "No members in this group yet",
  group_settings_close: "Close",
  group_settings_save_and_exit: "Save & close",

  // --- Invites ---
  create_invite_link: "Create invite link",
  invite_by_link: "Invite by link",
  copy_link: "Copy link",
  copied: "Copied!",
  share_link: "Share (in Telegram)",
  share: "Share",
  shared: "Link ready to paste!",
  invite_friend: "Invite a friend",
  invite_error: "Failed to create link. Try again later.",
  invite_message:
    "Join me on Splitto — an easy way to manage shared expenses right in Telegram.\nHere is your invite link:\n{{link}}",
  error_invite_link: "Failed to get the link",

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
  delete: "Delete",
  loading: "Loading...",
  save_failed: "Failed to save",
  delete_failed: "Failed to delete",

  // --- Errors & system ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "You can't leave this group right now because you have outstanding debts to other members. Please settle your debts and try again.",

  // --- Currencies ---
  currency: {
    select_title: "Choose currency",
    search_placeholder: "Search currency",
    not_found: "Nothing found",
    main_currency: "Main currency",
    select_short: "Choose currency",
    currency_popular: "Popular",
  },

  // --- Common & group form ---
  common: {
    yes: "Yes",
    no: "No",
  },
  errors: {
    group_name_required: "Enter a group name",
    group_trip_date_required: "Provide a trip date",
    create_group_failed: "Failed to create group",
  },
  group_form: {
    name_placeholder: "Group name",
    description_placeholder: "Description",
    is_trip: "Trip group?",
    trip_date:
      "Enter a date after which the group (if there are no debts) will be moved to archive automatically",
    name_hint_initial: "Enter a group name (up to {{max}} characters)",
    name_hint_remaining: "{{n}} characters left",
    desc_hint_initial: "Enter a description (up to {{max}} characters)",
    desc_hint_remaining: "{{n}} characters left",
    trip_date_placeholder: "DD.MM.YYYY",
  },

  // --- Add members modal ---
  add_members_modal: {
    title: "Add participants",
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
    group_placeholder: "Choose…",
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
    split_equal: "Evenly",
    split_shares: "By shares",
    split_custom: "Custom",
    transfer_from: "Sender",
    transfer_to: "Recipients",
    cancel: "Cancel",
    create: "Create",
    next: "Next",
    back: "Back",
    choose_group_first: "Choose a group first",

    // Validation/preview
    amount_required: "Enter an amount",
    comment_required: "Enter a comment",
    category_required: "Choose a category",
    split_no_participants: "Choose participants",
    split_no_shares: "Shares are not set",
    split_custom_mismatch: "Per-person total does not match the overall amount",
    per_share: "Per share",
    custom_amounts_set: "Custom amounts set",
    totals_mismatch: "Totals don't match",
    each: "each:",
    create_and_new: "Create and new",

    // New
    all: "ALL",
    paid_by_label: "Paid by",
    owes_label: "Owes",

    // Delete confirm
    delete_confirm: "Delete the transaction? This action cannot be undone.",
  },

  // --- Category ---
  category: {
    select_title: "Choose category",
    search_placeholder: "Search category",
    not_found: "Nothing found",
  },

  // --- Date format for cards ---
  date_card: {
    pattern: "{{day}} {{month}}",
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },

  // ActionModal title
  actions: "Actions",
};
