/* ==========================================================
   BrewTest mock data
   Everything here is sample data for the frontend phase.
   The seed is generated once, then persisted in localStorage.
   ========================================================== */

export const TECHNIQUES = [
  'Equivalence Partitioning',
  'Boundary Value Analysis',
  'Decision Table',
  'State Transition',
  'Error Guessing',
  'Use Case',
];

export const BROWSERS = [
  { id: 'chrome', name: 'Chrome', version: '126' },
  { id: 'firefox', name: 'Firefox', version: '127' },
  { id: 'safari', name: 'Safari', version: '17 (WebKit)' },
  { id: 'edge', name: 'Edge', version: '126' },
];

export const SUITE_TYPES = {
  functional: { name: 'Functional Testing', icon: 'list-checks' },
  'cross-browser': { name: 'Cross-Browser Testing', icon: 'globe' },
  responsive: { name: 'Responsive Design Testing', icon: 'smartphone' },
  performance: { name: 'Performance & Robustness Testing', icon: 'gauge' },
};

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
export const REQUIREMENT_STATUSES = ['Draft', 'In Review', 'Approved', 'Implemented'];

const P1 = 'prj-shopflow';
const P2 = 'prj-atlas';
const P3 = 'prj-lumen';

/* ---------- Deterministic PRNG so the seed is stable ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400000;
const daysAgo = (d, h = 9, m = 0) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

/* ---------- Projects ---------- */
function seedProjects() {
  return [
    {
      id: P1, name: 'ShopFlow E-Commerce',
      description: 'A web-based e-commerce application used to demonstrate functional software testing and automation.',
      status: 'Active', createdAt: '2026-08-04T09:00:00.000Z', lastActivityAt: daysAgo(0, 8, 12),
    },
    {
      id: P2, name: 'Atlas Banking Portal',
      description: 'Customer-facing online banking portal covering account overview, transfers and two-factor sign-in.',
      status: 'Active', createdAt: '2026-09-15T10:30:00.000Z', lastActivityAt: daysAgo(2, 15, 40),
    },
    {
      id: P3, name: 'Lumen Booking App',
      description: 'Appointment booking web app for wellness studios. Testing is paused until the redesign ships.',
      status: 'On hold', createdAt: '2026-06-20T08:00:00.000Z', lastActivityAt: daysAgo(19, 11, 5),
    },
  ];
}

/* ---------- Environments ---------- */
function seedEnvironments() {
  return [
    { id: 'env-staging', name: 'Staging', baseUrl: 'https://staging.shopflow.example.com', type: 'Pre-production', status: 'Online', browsers: ['chrome', 'firefox', 'safari', 'edge'], notes: 'Refreshed nightly from the main branch. Seeded with 400 sample products.' },
    { id: 'env-qa', name: 'QA', baseUrl: 'https://qa.shopflow.example.com', type: 'Integration', status: 'Online', browsers: ['chrome', 'firefox', 'edge'], notes: 'Used for regression runs. Payment gateway runs in sandbox mode.' },
    { id: 'env-mirror', name: 'Production mirror', baseUrl: 'https://mirror.shopflow.example.com', type: 'Read-only', status: 'Degraded', browsers: ['chrome', 'safari'], notes: 'Read-only copy of production data. Checkout is disabled here.' },
    { id: 'env-local', name: 'Local development', baseUrl: 'http://localhost:3000', type: 'Local', status: 'Offline', browsers: ['chrome'], notes: 'Runs on a developer machine. Start the dev server before executing tests.' },
  ];
}

/* ---------- Requirements: ShopFlow ---------- */
function seedRequirements() {
  const R = (id, title, priority, status, created, description, userStory, ac, rules) =>
    ({ id, projectId: P1, title, priority, status, createdAt: created, description, userStory, acceptanceCriteria: ac, businessRules: rules });

  const shop = [
    R('REQ-001', 'User Authentication', 'Critical', 'Approved', '2026-08-06',
      'Shoppers must be able to sign in and out securely using an email address and password. Sessions must be protected against brute-force attempts.',
      'As a registered shopper, I want to log in with my email and password so that I can see my orders and saved details.',
      ['A valid email and password signs the shopper in and opens the account page.',
       'Invalid credentials show "Incorrect email or password" without revealing which field was wrong.',
       'The account locks for 15 minutes after 5 consecutive failed attempts.',
       'Logging out ends the session and returns the shopper to the home page.',
       '"Keep me signed in" extends the session to 30 days.',
       'A password reset email is sent within 60 seconds of the request.'],
      ['Passwords must be at least 8 characters and include one number.', 'Sessions expire after 30 minutes of inactivity.', 'Login attempts are rate-limited per account and per IP address.']),
    R('REQ-002', 'Product Browsing', 'High', 'Implemented', '2026-08-06',
      'Shoppers can browse the full product catalogue in a paginated grid and open a detail page for any product.',
      'As a shopper, I want to browse products by category so that I can discover items without knowing exactly what I want.',
      ['The catalogue shows 24 products per page with name, price and primary image.',
       'Selecting a product opens its detail page with description, price and stock status.',
       'Products with zero stock show an "Out of stock" badge and a disabled Add to cart button.',
       'Pagination controls reflect the current page and disable at the first and last page.',
       'Requesting a page number beyond the last page redirects to the last page.'],
      ['Prices are shown in USD with two decimals.', 'Archived products never appear in the catalogue.']),
    R('REQ-003', 'Shopping Cart Management', 'Critical', 'Approved', '2026-08-09',
      'Shoppers can add, update and remove products in a cart that survives page refreshes and sign-in.',
      'As a shopper, I want to manage items in my cart so that I can review what I am about to buy.',
      ['Adding a product increases the cart badge and shows a confirmation.',
       'Quantity can be changed from 1 up to the available stock.',
       'Quantities above available stock are rejected with a clear message.',
       'Removing an item updates the subtotal immediately.',
       'The cart is preserved after a page refresh and after signing in.'],
      ['A single product line is limited to 10 units.', 'The cart subtotal excludes shipping and tax.', 'Guest carts merge into the account cart on sign-in.']),
    R('REQ-004', 'Checkout Process', 'Critical', 'In Review', '2026-08-14',
      'Shoppers complete a purchase by entering shipping details, choosing a delivery option and paying by card.',
      'As a shopper, I want to check out quickly and safely so that I can receive my order without friction.',
      ['Shipping address fields are required before payment can be entered.',
       'A valid card completes the order and shows an order confirmation number.',
       'Expired or invalid cards are rejected with a specific error message.',
       'A valid discount code reduces the order total before payment.',
       'Double-clicking Place order creates only one order.'],
      ['Orders over $75 qualify for free standard shipping.', 'Discount codes cannot be combined.', 'Card numbers are never stored by ShopFlow.']),
    R('REQ-005', 'User Profile Management', 'Medium', 'Approved', '2026-08-18',
      'Signed-in shoppers can view and update their personal information and change their password.',
      'As a registered shopper, I want to update my contact details so that deliveries and receipts reach me.',
      ['The profile page shows the current name, email and phone number.',
       'Saving valid changes shows a confirmation and persists the new values.',
       'Phone numbers must match the international format (+ followed by 8–15 digits).',
       'New passwords must meet the password policy before they are accepted.'],
      ['Email addresses are unique across accounts.', 'Changing an email address requires re-verification.']),
    R('REQ-006', 'Product Search & Filtering', 'High', 'Approved', '2026-08-21',
      'Shoppers can search products by keyword and narrow results by category, price range and rating.',
      'As a shopper, I want to filter search results so that I only see products that match my budget and needs.',
      ['Search returns matching products within 1 second for catalogues up to 10,000 items.',
       'Category and price filters can be combined and update the result count.',
       'A search with no matches shows an empty state with suggestions.',
       'Clearing all filters restores the full catalogue.'],
      ['Search is case-insensitive.', 'The price filter accepts values between $0 and $5,000.']),
    R('REQ-007', 'Form Validation & Error Handling', 'High', 'Approved', '2026-08-25',
      'All forms validate input on the client and show clear, specific messages next to the field that needs attention.',
      'As a shopper, I want clear error messages so that I know exactly how to fix my input.',
      ['Required fields show "This field is required" when left empty.',
       'Email fields reject malformed addresses.',
       'Error messages are announced to screen readers.',
       'Valid input removes the error state immediately.'],
      ['Validation runs on blur and on submit.', 'Server-side validation errors use the same visual treatment.']),
    R('REQ-008', 'Cross-Browser Compatibility', 'High', 'Approved', '2026-09-02',
      'Core shopper journeys must behave identically in the latest versions of Chrome, Firefox, Safari and Edge.',
      'As a shopper, I want the store to work in my preferred browser so that I can buy without switching.',
      ['Login, cart and checkout complete successfully in all four supported browsers.',
       'Layout differences between browsers do not hide or overlap interactive elements.',
       'Form controls remain usable with each browser’s native styling.'],
      ['Supported browsers are the latest two major versions of each engine.']),
    R('REQ-009', 'Responsive Storefront Layout', 'Medium', 'Approved', '2026-09-05',
      'The storefront adapts to mobile, tablet and laptop screen sizes without horizontal scrolling.',
      'As a mobile shopper, I want pages that fit my screen so that I can browse and buy on my phone.',
      ['No horizontal scrolling at 375px, 768px and 1024px widths.',
       'Navigation collapses into a menu below 768px.',
       'Tap targets are at least 44px on touch devices.'],
      ['Breakpoints are 375px, 768px and 1024px.']),
    R('REQ-010', 'Performance & Robustness', 'Medium', 'Draft', '2026-09-12',
      'The store stays fast under load and recovers gracefully from network and server errors.',
      'As a shopper, I want pages to load quickly and recover from errors so that I do not lose my progress.',
      ['The catalogue loads in under 3 seconds on a simulated 4G connection.',
       'Network failures during checkout show a retry option without losing the cart.',
       'Unexpected server errors show a friendly error page, never a stack trace.'],
      ['Performance budgets are measured on the Staging environment.']),
  ];

  const A = (id, title, priority, status, created, description, userStory, ac, rules) =>
    ({ id, projectId: P2, title, priority, status, createdAt: created, description, userStory, acceptanceCriteria: ac, businessRules: rules });
  const atlas = [
    A('REQ-001', 'Account Overview', 'High', 'Approved', '2026-09-18', 'Customers see balances and the last 20 transactions for each account.',
      'As a customer, I want to see all my balances in one place so that I can track my money.',
      ['Balances load within 2 seconds.', 'Transactions are listed newest first.'], ['Balances are shown in the account currency.']),
    A('REQ-002', 'Fund Transfer', 'Critical', 'In Review', '2026-09-22', 'Customers can transfer funds between their own accounts and to saved payees.',
      'As a customer, I want to transfer money so that I can pay people without visiting a branch.',
      ['Transfers above the available balance are rejected.', 'A confirmation reference is shown after a successful transfer.'], ['Daily transfer limit is $10,000.']),
    A('REQ-003', 'Two-Factor Sign-in', 'Critical', 'Approved', '2026-09-25', 'Sign-in requires a six-digit one-time code after the password step.',
      'As a customer, I want a second verification step so that my account stays safe.',
      ['A correct code completes sign-in.', 'Three wrong codes lock the sign-in for 10 minutes.'], ['Codes expire after 5 minutes.']),
  ];
  return [...shop, ...atlas];
}

/* ---------- Test cases ---------- */
const AREA = {
  'REQ-001': 'the sign-in page', 'REQ-002': 'the product catalogue', 'REQ-003': 'the shopping cart',
  'REQ-004': 'the checkout page', 'REQ-005': 'the profile page', 'REQ-006': 'the product search page',
  'REQ-007': 'the registration form', 'REQ-008': 'the storefront', 'REQ-009': 'the storefront', 'REQ-010': 'the storefront',
};

/* Hand-written, detailed functional cases: TC-001 to TC-024 */
const DETAILED = [
  { t: 'Log in with valid credentials', r: 'REQ-001', ty: 'Positive', te: 'Use Case', p: 'Critical', ac: 0,
    o: 'Confirm a registered shopper can sign in and reach their account page.',
    pre: 'Shopper account maia.chen@example.com exists and is active. The shopper is signed out.',
    d: 'Email: maia.chen@example.com\nPassword: Brew#2026x',
    s: ['Open the sign-in page.', 'Enter the email address and password.', 'Select "Sign in".'],
    e: 'The shopper is redirected to the account page and the header shows "Hi, Maia".' },
  { t: 'Reject login with a wrong password', r: 'REQ-001', ty: 'Negative', te: 'Equivalence Partitioning', p: 'High', ac: 1,
    o: 'Verify an incorrect password is rejected without exposing which field was wrong.',
    pre: 'Shopper account maia.chen@example.com exists.',
    d: 'Email: maia.chen@example.com\nPassword: WrongPass1',
    s: ['Open the sign-in page.', 'Enter the valid email and the wrong password.', 'Select "Sign in".'],
    e: 'The message "Incorrect email or password" appears and the shopper stays on the sign-in page.' },
  { t: 'Reject login for an unregistered email', r: 'REQ-001', ty: 'Negative', te: 'Equivalence Partitioning', p: 'High', ac: 1,
    o: 'Verify an unknown email gets the same generic error as a wrong password.',
    pre: 'No account exists for ghost.user@example.com.',
    d: 'Email: ghost.user@example.com\nPassword: Brew#2026x',
    s: ['Open the sign-in page.', 'Enter the unregistered email and any password.', 'Select "Sign in".'],
    e: 'The message "Incorrect email or password" appears. No hint reveals that the email is unknown.' },
  { t: 'Lock account after 5 failed login attempts', r: 'REQ-001', ty: 'Negative', te: 'State Transition', p: 'High', ac: 2,
    o: 'Confirm repeated failures move the account into a locked state.',
    pre: 'Shopper account li.wei@example.com exists and has no recent failed attempts.',
    d: 'Email: li.wei@example.com\nPassword attempts: Wrong1, Wrong2, Wrong3, Wrong4, Wrong5',
    s: ['Open the sign-in page.', 'Submit the wrong password five times in a row.', 'Submit the correct password a sixth time.'],
    e: 'The sixth attempt is blocked with "Account locked. Try again in 15 minutes."' },
  { t: 'Log out ends the session', r: 'REQ-001', ty: 'Positive', te: 'Use Case', p: 'High', ac: 3,
    o: 'Verify logging out clears the session and protects account pages.',
    pre: 'The shopper is signed in.',
    d: 'Account: maia.chen@example.com',
    s: ['Open the account menu.', 'Select "Log out".', 'Press the browser Back button.'],
    e: 'The shopper lands on the home page. Going back shows the sign-in page, not account data.' },
  { t: 'Browse the product catalogue grid', r: 'REQ-002', ty: 'Positive', te: 'Use Case', p: 'High', ac: 0,
    o: 'Verify the catalogue shows 24 products per page with name, price and image.',
    pre: 'The catalogue contains more than 24 active products.',
    d: 'Category: All products',
    s: ['Open the Shop page.', 'Count the product tiles on the first page.', 'Check each tile for name, price and image.'],
    e: '24 tiles are shown and each has a name, a USD price with two decimals and an image.' },
  { t: 'Open a product detail page', r: 'REQ-002', ty: 'Positive', te: 'Use Case', p: 'Medium', ac: 1,
    o: 'Confirm selecting a product opens its detail page with complete information.',
    pre: 'Product "Ceramic Pour-over Set" (SKU CP-210) is active.',
    d: 'SKU: CP-210',
    s: ['Open the Shop page.', 'Select "Ceramic Pour-over Set".'],
    e: 'The detail page shows the description, price $42.00 and stock status "In stock".' },
  { t: 'Show Out of stock badge for unavailable products', r: 'REQ-002', ty: 'Positive', te: 'Decision Table', p: 'Medium', ac: 2,
    o: 'Verify zero-stock products cannot be added to the cart.',
    pre: 'Product "Linen Apron" (SKU LA-044) has stock 0.',
    d: 'SKU: LA-044 · Stock: 0',
    s: ['Open the detail page for "Linen Apron".', 'Inspect the stock badge.', 'Try to select "Add to cart".'],
    e: 'The "Out of stock" badge is visible and the Add to cart button is disabled.' },
  { t: 'Redirect to the last page when the page number is too high', r: 'REQ-002', ty: 'Negative', te: 'Boundary Value Analysis', p: 'Low', ac: 4,
    o: 'Check the boundary just beyond the last page of the catalogue.',
    pre: 'The catalogue has 11 pages.',
    d: 'URL: /shop?page=12',
    s: ['Open /shop?page=12 directly.', 'Read the active page indicator.'],
    e: 'The shopper is redirected to page 11 and the Next button is disabled.' },
  { t: 'Add a product to the cart', r: 'REQ-003', ty: 'Positive', te: 'Use Case', p: 'Critical', ac: 0,
    o: 'Verify adding a product updates the cart badge and confirms the action.',
    pre: 'The cart is empty. Product CP-210 is in stock.',
    d: 'SKU: CP-210 · Quantity: 1',
    s: ['Open the detail page for CP-210.', 'Select "Add to cart".', 'Look at the cart badge in the header.'],
    e: 'The badge shows 1 and a toast reads "Added to cart".' },
  { t: 'Increase quantity up to the maximum available stock', r: 'REQ-003', ty: 'Positive', te: 'Boundary Value Analysis', p: 'High', ac: 1,
    o: 'Check the upper boundary of the quantity selector.',
    pre: 'Product CP-210 has 6 units in stock and is in the cart.',
    d: 'Quantity: 6',
    s: ['Open the cart.', 'Set the quantity of CP-210 to 6.', 'Review the line total.'],
    e: 'The quantity is accepted and the line total equals 6 × $42.00 = $252.00.' },
  { t: 'Reject quantity above available stock', r: 'REQ-003', ty: 'Negative', te: 'Boundary Value Analysis', p: 'High', ac: 2,
    o: 'Check the boundary one unit above available stock.',
    pre: 'Product CP-210 has 6 units in stock and is in the cart.',
    d: 'Quantity: 7',
    s: ['Open the cart.', 'Set the quantity of CP-210 to 7.'],
    e: 'The value is rejected with "Only 6 available" and the quantity returns to the previous value.' },
  { t: 'Remove a product from the cart', r: 'REQ-003', ty: 'Positive', te: 'Use Case', p: 'High', ac: 3,
    o: 'Verify removing a line updates the subtotal immediately.',
    pre: 'The cart contains CP-210 ($42.00) and MG-015 ($18.00).',
    d: 'Remove: MG-015',
    s: ['Open the cart.', 'Select "Remove" on the MG-015 line.'],
    e: 'The line disappears and the subtotal changes from $60.00 to $42.00 without a page reload.' },
  { t: 'Cart persists after a page refresh', r: 'REQ-003', ty: 'Positive', te: 'State Transition', p: 'Medium', ac: 4,
    o: 'Confirm cart contents are preserved across reloads.',
    pre: 'The cart contains two products.',
    d: 'Cart: CP-210 × 1, MG-015 × 2',
    s: ['Open the cart.', 'Reload the browser tab.', 'Compare the cart contents.'],
    e: 'The same two lines with the same quantities are shown after the reload.' },
  { t: 'Complete checkout with a valid card', r: 'REQ-004', ty: 'Positive', te: 'Use Case', p: 'Critical', ac: 1,
    o: 'Verify an end-to-end purchase with a valid test card.',
    pre: 'Signed-in shopper with one product in the cart. Payment gateway is in sandbox mode.',
    d: 'Card: 4242 4242 4242 4242 · Exp: 12/29 · CVC: 123',
    s: ['Open the cart and select "Checkout".', 'Enter a valid shipping address.', 'Choose standard delivery.', 'Enter the card details and select "Place order".'],
    e: 'An order confirmation page shows a confirmation number and the cart is emptied.' },
  { t: 'Reject checkout with an expired card', r: 'REQ-004', ty: 'Negative', te: 'Equivalence Partitioning', p: 'High', ac: 2,
    o: 'Verify expired cards are rejected with a specific message.',
    pre: 'Signed-in shopper at the payment step.',
    d: 'Card: 4242 4242 4242 4242 · Exp: 01/24 · CVC: 123',
    s: ['Enter the expired card details.', 'Select "Place order".'],
    e: 'The message "Your card has expired" appears next to the expiry field and no order is created.' },
  { t: 'Require shipping address before payment', r: 'REQ-004', ty: 'Negative', te: 'Decision Table', p: 'High', ac: 0,
    o: 'Check that every required shipping field blocks the payment step.',
    pre: 'Signed-in shopper at the shipping step.',
    d: 'Empty: Street, City, Postal code',
    s: ['Leave the address fields empty.', 'Select "Continue to payment".'],
    e: 'Each empty field shows "This field is required" and the payment step stays locked.' },
  { t: 'Apply a valid discount code', r: 'REQ-004', ty: 'Positive', te: 'Decision Table', p: 'Medium', ac: 3,
    o: 'Verify a valid code reduces the order total.',
    pre: 'Cart subtotal is $80.00. Code BREW10 gives 10% off.',
    d: 'Code: BREW10',
    s: ['Open the order summary.', 'Enter BREW10 and select "Apply".'],
    e: 'The discount line shows -$8.00 and the total updates to $72.00.' },
  { t: 'Update profile name and phone number', r: 'REQ-005', ty: 'Positive', te: 'Use Case', p: 'Medium', ac: 1,
    o: 'Confirm valid profile changes are saved and persisted.',
    pre: 'Signed-in shopper on the profile page.',
    d: 'Name: Maia Chen-Rivera\nPhone: +14155550137',
    s: ['Change the name and phone number.', 'Select "Save changes".', 'Reload the page.'],
    e: 'A "Profile updated" message appears and the new values are still shown after the reload.' },
  { t: 'Reject an invalid phone number format', r: 'REQ-005', ty: 'Negative', te: 'Equivalence Partitioning', p: 'Medium', ac: 2,
    o: 'Verify phone numbers outside the accepted format are rejected.',
    pre: 'Signed-in shopper on the profile page.',
    d: 'Phone: 555-CALL-NOW',
    s: ['Enter the invalid phone number.', 'Select "Save changes".'],
    e: 'The message "Enter a number like +14155550137" is shown and nothing is saved.' },
  { t: 'Reject a weak new password (7 characters)', r: 'REQ-005', ty: 'Negative', te: 'Boundary Value Analysis', p: 'High', ac: 3,
    o: 'Check the lower boundary of the password length policy.',
    pre: 'Signed-in shopper on the change-password form.',
    d: 'New password: Brew#12 (7 characters)',
    s: ['Enter the current password.', 'Enter the 7-character new password.', 'Select "Update password".'],
    e: 'The form shows "Use at least 8 characters with one number" and the password is not changed.' },
  { t: 'Filter products by category and price range', r: 'REQ-006', ty: 'Positive', te: 'Decision Table', p: 'High', ac: 1,
    o: 'Verify category and price filters combine correctly.',
    pre: 'The catalogue contains products in Brewing gear priced from $9 to $120.',
    d: 'Category: Brewing gear · Price: $20–$60',
    s: ['Open the Shop page.', 'Choose the category "Brewing gear".', 'Set the price range to $20–$60.'],
    e: 'Only Brewing gear products priced between $20 and $60 are listed and the count matches.' },
  { t: 'Show an empty state when search has no matches', r: 'REQ-006', ty: 'Negative', te: 'Error Guessing', p: 'Medium', ac: 2,
    o: 'Confirm a search with no results guides the shopper.',
    pre: 'No product contains the word "zzxqv".',
    d: 'Search: zzxqv',
    s: ['Type "zzxqv" in the search field.', 'Press Enter.'],
    e: 'An empty state reads "No products match zzxqv" and offers category suggestions.' },
  { t: 'Reject a malformed email on registration', r: 'REQ-007', ty: 'Negative', te: 'Equivalence Partitioning', p: 'High', ac: 1,
    o: 'Verify the email field blocks addresses without a domain.',
    pre: 'The registration form is open.',
    d: 'Email: maia.chen@',
    s: ['Type the malformed email.', 'Move focus to the next field.'],
    e: 'The message "Enter a valid email address" appears and the Create account button stays disabled.' },
];

/* Compact functional cases: TC-025 to TC-070 → [title, req, type, technique, priority, data, expected] */
const FUNCTIONAL = [
  ['Log in with email in uppercase letters', 'REQ-001', 'Positive', 'Equivalence Partitioning', 'Medium', 'Email: MAIA.CHEN@EXAMPLE.COM', 'The shopper signs in successfully.'],
  ['Keep me signed in extends the session', 'REQ-001', 'Positive', 'State Transition', 'Medium', 'Option: Keep me signed in', 'The session cookie expires after 30 days.'],
  ['Request a password reset email', 'REQ-001', 'Positive', 'Use Case', 'High', 'Email: maia.chen@example.com', 'A reset email arrives within 60 seconds.'],
  ['Reject password reset for an unknown email silently', 'REQ-001', 'Negative', 'Error Guessing', 'Medium', 'Email: nobody@example.com', 'The same confirmation message is shown and no email is sent.'],
  ['Session expires after 30 minutes of inactivity', 'REQ-001', 'Positive', 'Boundary Value Analysis', 'High', 'Idle time: 30 minutes', 'The next action redirects to the sign-in page.'],
  ['Reject login with an empty password', 'REQ-001', 'Negative', 'Equivalence Partitioning', 'Medium', 'Password: (empty)', 'The field shows "This field is required".'],
  ['Prevent SQL injection in the login email field', 'REQ-001', 'Negative', 'Error Guessing', 'High', "Email: ' OR '1'='1", 'The login fails with the generic error message.'],
  ['Sort products by price ascending', 'REQ-002', 'Positive', 'Use Case', 'Medium', 'Sort: Price low to high', 'Products are ordered from the cheapest to the most expensive.'],
  ['Show product images with alternative text', 'REQ-002', 'Positive', 'Equivalence Partitioning', 'Low', 'Page: first catalogue page', 'Every product image has descriptive alt text.'],
  ['Hide archived products from the catalogue', 'REQ-002', 'Negative', 'Decision Table', 'Medium', 'Product: archived SKU AR-001', 'The archived product is not listed and its URL shows "Not found".'],
  ['Previous button is disabled on the first page', 'REQ-002', 'Positive', 'Boundary Value Analysis', 'Low', 'Page: 1', 'The Previous button is disabled.'],
  ['Show related products on the detail page', 'REQ-002', 'Positive', 'Use Case', 'Low', 'SKU: CP-210', 'Four related products from the same category are shown.'],
  ['Add the same product twice increases quantity', 'REQ-003', 'Positive', 'Use Case', 'High', 'SKU: CP-210 × 2 clicks', 'One cart line with quantity 2 is shown.'],
  ['Reject quantity of zero', 'REQ-003', 'Negative', 'Boundary Value Analysis', 'High', 'Quantity: 0', 'The quantity returns to 1 with a message.'],
  ['Reject a negative quantity', 'REQ-003', 'Negative', 'Equivalence Partitioning', 'Medium', 'Quantity: -3', 'The value is rejected and the previous quantity is kept.'],
  ['Limit a single line to 10 units', 'REQ-003', 'Negative', 'Boundary Value Analysis', 'High', 'Quantity: 11', 'The message "Maximum 10 per order" is shown.'],
  ['Merge guest cart into account cart on sign-in', 'REQ-003', 'Positive', 'State Transition', 'High', 'Guest cart: MG-015 × 1', 'The account cart contains the guest items after sign-in.'],
  ['Cart subtotal excludes shipping and tax', 'REQ-003', 'Positive', 'Decision Table', 'Medium', 'Cart: $60.00', 'Subtotal reads $60.00 with shipping and tax listed separately.'],
  ['Empty cart shows a prompt to continue shopping', 'REQ-003', 'Positive', 'Use Case', 'Low', 'Cart: empty', 'An empty state with a "Browse products" button is shown.'],
  ['Free standard shipping above $75', 'REQ-004', 'Positive', 'Boundary Value Analysis', 'High', 'Subtotal: $75.01', 'Standard shipping is shown as free.'],
  ['Shipping fee applies at exactly $75', 'REQ-004', 'Positive', 'Boundary Value Analysis', 'High', 'Subtotal: $75.00', 'A standard shipping fee of $5.95 is added.'],
  ['Reject an invalid discount code', 'REQ-004', 'Negative', 'Equivalence Partitioning', 'Medium', 'Code: FREEMONEY', 'The message "This code is not valid" is shown and the total is unchanged.'],
  ['Reject combining two discount codes', 'REQ-004', 'Negative', 'Decision Table', 'Medium', 'Codes: BREW10, WELCOME5', 'The second code is refused with an explanation.'],
  ['Prevent duplicate orders on double-click', 'REQ-004', 'Negative', 'Error Guessing', 'Critical', 'Action: double-click Place order', 'Only one order is created.'],
  ['Reject a card number that fails the Luhn check', 'REQ-004', 'Negative', 'Equivalence Partitioning', 'High', 'Card: 4242 4242 4242 4241', 'The message "Check your card number" is shown.'],
  ['Reject a CVC shorter than 3 digits', 'REQ-004', 'Negative', 'Boundary Value Analysis', 'Medium', 'CVC: 12', 'The CVC field shows an error and payment is blocked.'],
  ['Show an order summary before payment', 'REQ-004', 'Positive', 'Use Case', 'Medium', 'Cart: 2 products', 'Items, shipping and total match the cart.'],
  ['Email an order receipt after purchase', 'REQ-004', 'Positive', 'Use Case', 'Medium', 'Order: any completed order', 'A receipt email with the order number arrives.'],
  ['Display current name, email and phone', 'REQ-005', 'Positive', 'Use Case', 'Low', 'Account: maia.chen@example.com', 'The saved profile values are shown.'],
  ['Require re-verification when the email changes', 'REQ-005', 'Positive', 'State Transition', 'High', 'New email: maia.new@example.com', 'A verification email is sent and the old email stays active until confirmed.'],
  ['Reject an email already used by another account', 'REQ-005', 'Negative', 'Decision Table', 'Medium', 'Email: li.wei@example.com', 'The message "This email is already in use" is shown.'],
  ['Accept a phone number at the minimum length', 'REQ-005', 'Positive', 'Boundary Value Analysis', 'Low', 'Phone: +12345678 (8 digits)', 'The value is accepted and saved.'],
  ['Reject a phone number above the maximum length', 'REQ-005', 'Negative', 'Boundary Value Analysis', 'Low', 'Phone: +1234567890123456 (16 digits)', 'The value is rejected with a format message.'],
  ['Search is case-insensitive', 'REQ-006', 'Positive', 'Equivalence Partitioning', 'Medium', 'Search: POUR-OVER', 'The same products appear as for "pour-over".'],
  ['Clear all filters restores the catalogue', 'REQ-006', 'Positive', 'Use Case', 'Medium', 'Filters: category + price', 'The full catalogue and original count return.'],
  ['Reject a price filter above the maximum', 'REQ-006', 'Negative', 'Boundary Value Analysis', 'Low', 'Max price: 5001', 'The field is limited to $5,000 with a message.'],
  ['Search handles special characters safely', 'REQ-006', 'Negative', 'Error Guessing', 'Medium', 'Search: <b>mug</b>', 'The text is treated as plain text and no markup is rendered.'],
  ['Combine search term with a category filter', 'REQ-006', 'Positive', 'Decision Table', 'Medium', 'Search: kettle · Category: Brewing gear', 'Only kettles within Brewing gear are shown.'],
  ['Required fields show an error when empty', 'REQ-007', 'Negative', 'Equivalence Partitioning', 'High', 'All registration fields empty', 'Every required field shows "This field is required".'],
  ['Error state clears when input becomes valid', 'REQ-007', 'Positive', 'State Transition', 'Medium', 'Email: maia.chen@example.com', 'The error message and red border disappear immediately.'],
  ['Announce validation errors to screen readers', 'REQ-007', 'Positive', 'Use Case', 'Medium', 'Tool: screen reader', 'Each error message is announced when it appears.'],
  ['Reject leading and trailing spaces in email', 'REQ-007', 'Negative', 'Error Guessing', 'Low', 'Email: " maia@example.com "', 'The value is trimmed or rejected with a clear message.'],
  ['Show server validation errors in the same style', 'REQ-007', 'Positive', 'Use Case', 'Medium', 'Email already registered', 'The server error appears next to the field with the standard style.'],
  ['Reject a name longer than 80 characters', 'REQ-007', 'Negative', 'Boundary Value Analysis', 'Low', 'Name: 81 characters', 'The field shows "Use 80 characters or fewer".'],
  ['Accept a name of exactly 80 characters', 'REQ-007', 'Positive', 'Boundary Value Analysis', 'Low', 'Name: 80 characters', 'The value is accepted.'],
  ['Show a friendly 404 page for unknown URLs', 'REQ-007', 'Negative', 'Error Guessing', 'Low', 'URL: /does-not-exist', 'A branded 404 page links back to the catalogue.'],
];

/* Cross-browser (24), responsive (18), performance (16) are generated from compact tables */
const XB_FLOWS = [
  ['Login', 'Critical', 'Open the sign-in page; sign in with valid credentials.', 'The account page opens with the shopper’s name.'],
  ['Product catalogue', 'High', 'Open the Shop page; scroll through two pages.', 'Tiles, images and pagination render without overlap.'],
  ['Add to cart', 'High', 'Open a product; select Add to cart; open the cart.', 'The item is listed with the correct price and quantity.'],
  ['Checkout payment form', 'Critical', 'Reach the payment step; fill in the sandbox card.', 'Fields accept input and the order is placed.'],
  ['Profile update', 'Medium', 'Open the profile; change the phone number; save.', 'The new value is saved and shown.'],
  ['Product filtering', 'Medium', 'Open the Shop page; apply category and price filters.', 'The filtered list and count update correctly.'],
];
const VIEWPORTS = [['Mobile', 375, 'Boundary Value Analysis'], ['Tablet', 768, 'Boundary Value Analysis'], ['Laptop', 1024, 'Equivalence Partitioning']];
const SCREENS = [
  ['Home page', 'Medium'], ['Product list', 'High'], ['Product detail', 'High'], ['Cart', 'High'], ['Checkout', 'Critical'], ['Profile', 'Low'],
];
const PERF = [
  ['Catalogue loads within 3 seconds on 4G', 'Positive', 'Boundary Value Analysis', 'High', 'Throttle: Fast 4G', 'Largest contentful paint is under 3 seconds.'],
  ['Search responds within 1 second for 10,000 products', 'Positive', 'Boundary Value Analysis', 'High', 'Catalogue: 10,000 items', 'Results are returned in under 1 second.'],
  ['Cart handles 100 line items', 'Positive', 'Boundary Value Analysis', 'Medium', 'Cart: 100 lines', 'The cart renders and totals update without lag.'],
  ['Rapid repeated Add to cart clicks', 'Negative', 'Error Guessing', 'Medium', '20 clicks in 2 seconds', 'The quantity matches the number of accepted clicks and no errors occur.'],
  ['Checkout recovers after a network drop', 'Negative', 'State Transition', 'Critical', 'Network: offline for 10 seconds', 'A retry option appears and the cart is preserved.'],
  ['Server error shows a friendly page', 'Negative', 'Error Guessing', 'High', 'API response: HTTP 500', 'A friendly error page is shown with no stack trace.'],
  ['Cart API timeout shows a retry message', 'Negative', 'Error Guessing', 'High', 'API delay: 30 seconds', 'The message "We couldn’t update your cart. Try again." is shown.'],
  ['Very long search text is handled', 'Negative', 'Boundary Value Analysis', 'Low', 'Search: 2,000 characters', 'The input is limited and no error page appears.'],
  ['Images load lazily below the fold', 'Positive', 'Use Case', 'Medium', 'Page: catalogue', 'Images below the fold load only when scrolled into view.'],
  ['Back button after order confirmation is safe', 'Negative', 'State Transition', 'High', 'Action: browser Back', 'The order is not placed again.'],
  ['Form resubmission after refresh is blocked', 'Negative', 'State Transition', 'High', 'Action: refresh after Place order', 'No duplicate order is created.'],
  ['Slow network login still succeeds', 'Positive', 'Equivalence Partitioning', 'Medium', 'Throttle: Slow 3G', 'Sign-in completes and shows a loading state.'],
  ['Memory stays stable across 200 page navigations', 'Positive', 'Boundary Value Analysis', 'Low', 'Navigations: 200', 'Memory growth stays under 50 MB.'],
  ['50 concurrent catalogue requests (simulated)', 'Positive', 'Equivalence Partitioning', 'Medium', 'Virtual users: 50', 'The 95th percentile response is under 2 seconds.'],
  ['Session recovery after server restart', 'Negative', 'State Transition', 'Medium', 'Action: restart the staging server', 'The shopper is asked to sign in again and the cart is preserved.'],
  ['Large cart image set does not block checkout', 'Positive', 'Use Case', 'Low', 'Cart: 30 images', 'Checkout becomes interactive within 2 seconds.'],
];

const FAILED = new Set([4, 12, 16, 21, 29, 38, 52, 77, 83, 99, 107, 121]);
const DRAFT = new Set([18, 25, 33, 41, 47, 55, 62, 68, 90, 103, 110, 116, 122, 126]);
const REJECTED = new Set([23, 36, 59, 66, 93, 118]);

function seedTestCases(suiteIds) {
  const list = [];
  const authors = ['Alex Morgan', 'Priya Nair', 'Tomás Herrera'];
  const push = (c) => {
    const n = list.length + 1;
    const id = `TC-${String(n).padStart(3, '0')}`;
    const status = REJECTED.has(n) ? 'Rejected' : DRAFT.has(n) ? 'Draft' : 'Validated';
    const lastResult = status !== 'Validated' ? 'pending' : FAILED.has(n) ? 'failed' : 'passed';
    list.push({
      id, projectId: P1, status, lastResult, author: authors[n % 3],
      createdAt: daysAgo(40 - (n % 30), 10, (n * 7) % 60), updatedAt: daysAgo(n % 12, 11, (n * 11) % 60),
      ...c,
    });
  };

  DETAILED.forEach((c) => push({
    title: c.t, requirementId: c.r, type: c.ty, technique: c.te, priority: c.p, acceptanceIndex: c.ac, suiteId: suiteIds.functional,
    objective: c.o, preconditions: c.pre, testData: c.d, steps: c.s, expectedResult: c.e,
  }));

  FUNCTIONAL.forEach(([title, req, type, tech, pri, data, exp]) => push({
    title, requirementId: req, type, technique: tech, priority: pri, acceptanceIndex: 0, suiteId: suiteIds.functional,
    objective: `Verify that the behaviour matches ${req}: ${title.charAt(0).toLowerCase()}${title.slice(1)}.`,
    preconditions: 'The application is deployed to the selected environment and the test account is active.',
    testData: data,
    steps: [`Open ${AREA[req]}.`, `Prepare the test data: ${data}.`, `Carry out the scenario: ${title}.`, 'Compare the result with the expected result.'],
    expectedResult: exp,
  }));

  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  XB_FLOWS.forEach(([flow, pri, how, exp]) => browsers.forEach((b) => push({
    title: `${flow} works in ${b}`, requirementId: 'REQ-008', type: 'Positive', technique: 'Use Case', priority: pri, acceptanceIndex: 0, suiteId: suiteIds['cross-browser'],
    objective: `Confirm the ${flow.toLowerCase()} journey behaves the same in ${b}.`,
    preconditions: `${b} (latest stable) is available. The Staging environment is online.`,
    testData: `Browser: ${b} · Account: maia.chen@example.com`,
    steps: how.split('; ').map((s) => (s.endsWith('.') ? s : `${s}.`)),
    expectedResult: exp,
  })));

  SCREENS.forEach(([screen, pri]) => VIEWPORTS.forEach(([vp, w, tech]) => push({
    title: `${screen} layout at ${vp.toLowerCase()} width (${w}px)`, requirementId: 'REQ-009', type: 'Positive', technique: tech, priority: pri, acceptanceIndex: 0, suiteId: suiteIds.responsive,
    objective: `Check the ${screen.toLowerCase()} fits a ${w}px viewport without horizontal scrolling.`,
    preconditions: 'The browser window can be resized or device emulation is enabled.',
    testData: `Viewport: ${w} × 800`,
    steps: [`Set the viewport width to ${w}px.`, `Open the ${screen.toLowerCase()}.`, 'Scroll to the bottom and check for horizontal overflow.', 'Check that buttons and links remain readable and tappable.'],
    expectedResult: 'No horizontal scrolling. All controls are visible, readable and at least 44px tall on touch layouts.',
  })));

  PERF.forEach(([title, type, tech, pri, data, exp]) => push({
    title, requirementId: 'REQ-010', type, technique: tech, priority: pri, acceptanceIndex: 0, suiteId: suiteIds.performance,
    objective: `Verify robustness and speed: ${title.charAt(0).toLowerCase()}${title.slice(1)}.`,
    preconditions: 'The Staging environment is online with the standard sample catalogue.',
    testData: data,
    steps: ['Set up the conditions described in the test data.', 'Run the scenario.', 'Record timing and behaviour.'],
    expectedResult: exp,
  }));

  /* Atlas Banking Portal: a small second dataset */
  const atlas = [
    ['Show balances for all accounts', 'REQ-001', 'Positive', 'Use Case', 'High', 'Validated', 'passed', 'Each account shows its balance in the account currency.'],
    ['List the last 20 transactions newest first', 'REQ-001', 'Positive', 'Boundary Value Analysis', 'Medium', 'Validated', 'passed', 'Exactly 20 transactions are listed in descending date order.'],
    ['Reject a transfer above the available balance', 'REQ-002', 'Negative', 'Boundary Value Analysis', 'Critical', 'Validated', 'failed', 'The transfer is rejected with "Insufficient funds".'],
    ['Show a reference number after a transfer', 'REQ-002', 'Positive', 'Use Case', 'High', 'Draft', 'pending', 'A confirmation reference is displayed.'],
    ['Sign in with a correct one-time code', 'REQ-003', 'Positive', 'Use Case', 'Critical', 'Validated', 'passed', 'Sign-in completes and the dashboard opens.'],
    ['Lock sign-in after 3 wrong codes', 'REQ-003', 'Negative', 'State Transition', 'High', 'Validated', 'passed', 'Sign-in is locked for 10 minutes.'],
  ];
  atlas.forEach(([title, req, type, tech, pri, status, last, exp], i) => list.push({
    id: `TC-${String(i + 1).padStart(3, '0')}`, projectId: P2, title, requirementId: req, type, technique: tech, priority: pri, status, lastResult: last,
    acceptanceIndex: 0, suiteId: suiteIds.atlas[i < 4 ? 'functional' : 'functional'], author: 'Alex Morgan',
    createdAt: daysAgo(20 - i, 10), updatedAt: daysAgo(3, 14),
    objective: `Verify ${title.charAt(0).toLowerCase()}${title.slice(1)}.`, preconditions: 'A test customer is signed in to the Atlas staging environment.',
    testData: 'Customer: demo.customer@example.com', steps: ['Open the relevant page.', 'Perform the scenario.', 'Check the outcome.'], expectedResult: exp,
  }));

  return list;
}

/* ---------- Suites ---------- */
function seedSuites() {
  const ids = { functional: 'SU-001', 'cross-browser': 'SU-002', responsive: 'SU-003', performance: 'SU-004' };
  const atlasIds = { functional: 'SU-101', 'cross-browser': 'SU-102', responsive: 'SU-103', performance: 'SU-104' };
  const desc = {
    functional: 'Verifies login, browsing, cart, checkout, profile and form behaviour against the written requirements.',
    'cross-browser': 'Runs the key shopper journeys in Chrome, Firefox, Safari and Edge to catch engine-specific issues.',
    responsive: 'Checks every main screen at mobile, tablet and laptop widths for overflow and usable controls.',
    performance: 'Exercises load times, error recovery and unusual input to confirm the store stays stable.',
  };
  const mk = (type, id, projectId, env, browsers, created) => ({
    id, projectId, type, name: SUITE_TYPES[type].name, description: desc[type], environmentId: env, browsers, createdAt: created,
  });
  const shop = [
    mk('functional', ids.functional, P1, 'env-staging', ['chrome'], '2026-08-10T09:00:00.000Z'),
    mk('cross-browser', ids['cross-browser'], P1, 'env-staging', ['chrome', 'firefox', 'safari', 'edge'], '2026-09-03T09:00:00.000Z'),
    mk('responsive', ids.responsive, P1, 'env-qa', ['chrome', 'safari'], '2026-09-06T09:00:00.000Z'),
    mk('performance', ids.performance, P1, 'env-staging', ['chrome'], '2026-09-13T09:00:00.000Z'),
  ];
  const atlas = ['functional', 'cross-browser', 'responsive', 'performance'].map((t) =>
    mk(t, atlasIds[t], P2, 'env-qa', t === 'cross-browser' ? ['chrome', 'firefox', 'edge'] : ['chrome'], '2026-09-20T09:00:00.000Z'));
  return { suites: [...shop, ...atlas], ids, atlasIds };
}

/* ---------- Executions (simulated history) ---------- */
function seedExecutions(testCases, suites) {
  const rand = mulberry32(20261118);
  const out = [];
  let counter = 0;
  const browserCycle = {
    SU_FUNC: ['chrome', 'chrome', 'firefox'],
    SU_XB: ['chrome', 'firefox', 'safari', 'edge'],
    SU_RESP: ['chrome', 'safari'],
    SU_PERF: ['chrome'],
  };
  const plan = [
    // [daysAgo, hour, suiteIndex]
    [13, 9, 0], [13, 14, 1], [12, 10, 0], [11, 9, 2], [11, 16, 0], [10, 11, 3], [9, 9, 0], [9, 15, 1],
    [8, 10, 0], [7, 9, 2], [7, 13, 0], [6, 10, 1], [6, 16, 3], [5, 9, 0], [4, 11, 0], [4, 15, 2],
    [3, 9, 1], [3, 14, 0], [2, 10, 0], [2, 16, 3], [1, 9, 0], [1, 13, 1], [0, 7, 0], [0, 8, 2],
  ];
  const shopSuites = suites.filter((s) => s.projectId === P1);

  const run = (suite, d, h, browser, projectId) => {
    const cases = testCases.filter((t) => t.suiteId === suite.id && t.status === 'Validated');
    const results = cases.map((t, i) => {
      const flaky = rand();
      let status = 'passed';
      if (t.lastResult === 'failed') status = flaky < 0.82 ? 'failed' : 'passed';
      else if (flaky < 0.025) status = 'failed';
      else if (flaky > 0.985) status = 'skipped';
      const base = suite.type === 'performance' ? 3200 : suite.type === 'cross-browser' ? 2600 : 1500;
      const dur = Math.round(base * (0.5 + rand() * 1.4) + i * 7);
      return { tc: t.id, s: status, d: status === 'skipped' ? 0 : dur };
    });
    const total = results.reduce((a, r) => a + r.d, 0);
    const passed = results.filter((r) => r.s === 'passed').length;
    const failed = results.filter((r) => r.s === 'failed').length;
    const skipped = results.filter((r) => r.s === 'skipped').length;
    counter += 1;
    const startedAt = daysAgo(d, h, Math.floor(rand() * 50));
    return {
      id: `EX-${String(1000 + counter)}`, projectId, suiteId: suite.id, suiteName: suite.name, browser,
      environmentId: suite.environmentId, startedAt,
      durationMs: Math.round(total / (suite.type === 'functional' ? 4 : 2.5)),
      passed, failed, skipped, total: results.length, status: failed > 0 ? 'Failed' : 'Passed',
      simulated: true, results,
    };
  };

  plan.forEach(([d, h, si]) => {
    const suite = shopSuites[si];
    const key = ['SU_FUNC', 'SU_XB', 'SU_RESP', 'SU_PERF'][si];
    const cycle = browserCycle[key];
    out.push(run(suite, d, h, cycle[counter % cycle.length], P1));
  });

  const atlasSuite = suites.find((s) => s.projectId === P2 && s.type === 'functional');
  [[9, 10], [5, 11], [2, 15]].forEach(([d, h]) => out.push(run(atlasSuite, d, h, 'chrome', P2)));

  return out.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

/* ---------- Reports and notifications ---------- */
function seedReports() {
  return [
    { id: 'RPT-006', projectId: P1, name: 'Weekly execution summary', type: 'Execution summary', range: 'Last 7 days', format: 'CSV', generatedAt: daysAgo(1, 17, 5), generatedBy: 'Alex Morgan' },
    { id: 'RPT-005', projectId: P1, name: 'Requirement coverage', type: 'Coverage', range: 'All time', format: 'JSON', generatedAt: daysAgo(3, 12, 30), generatedBy: 'Priya Nair' },
    { id: 'RPT-004', projectId: P1, name: 'Cross-browser failures', type: 'Failure analysis', range: 'Last 14 days', format: 'CSV', generatedAt: daysAgo(5, 9, 45), generatedBy: 'Alex Morgan' },
    { id: 'RPT-003', projectId: P1, name: 'Sprint 14 release readiness', type: 'Execution summary', range: 'Last 14 days', format: 'JSON', generatedAt: daysAgo(8, 16, 10), generatedBy: 'Tomás Herrera' },
    { id: 'RPT-002', projectId: P1, name: 'Checkout regression results', type: 'Failure analysis', range: 'Last 7 days', format: 'CSV', generatedAt: daysAgo(10, 11, 20), generatedBy: 'Alex Morgan' },
    { id: 'RPT-001', projectId: P1, name: 'Baseline execution summary', type: 'Execution summary', range: 'All time', format: 'CSV', generatedAt: daysAgo(13, 18, 0), generatedBy: 'Priya Nair' },
  ];
}

function seedNotifications() {
  return [
    { id: 'n1', title: 'Functional Testing finished with failures', body: 'Run EX-1023 completed with 3 failed tests. Review the results.', time: daysAgo(0, 8, 12), tone: 'error', read: false, link: '#/execution' },
    { id: 'n2', title: 'REQ-004 moved to In Review', body: 'Priya Nair asked for a second review of the checkout requirement.', time: daysAgo(0, 7, 40), tone: 'info', read: false, link: '#/requirements' },
    { id: 'n3', title: '2 test cases need validation', body: 'TC-025 and TC-033 are still drafts and have not been approved.', time: daysAgo(1, 15, 5), tone: 'warning', read: false, link: '#/test-cases' },
    { id: 'n4', title: 'Responsive Design Testing passed', body: 'All 18 layout checks passed on Chrome and Safari.', time: daysAgo(2, 10, 30), tone: 'success', read: true, link: '#/test-suites' },
    { id: 'n5', title: 'Production mirror is degraded', body: 'Response times are above normal. Runs against this environment may be slow.', time: daysAgo(3, 9, 0), tone: 'warning', read: true, link: '#/environments' },
  ];
}

function seedSettings() {
  return {
    profile: { name: 'Alex Morgan', email: 'alex.morgan@brewtest.example.com', role: 'QA Engineer', timezone: 'Africa/Lagos' },
    appearance: { theme: 'light', density: 'comfortable', reducedMotion: false, sidebarCollapsed: false },
    notifications: { executionComplete: true, executionFailed: true, requirementChanges: true, weeklyDigest: false, inApp: true, email: false },
    testDefaults: { browser: 'chrome', environmentId: 'env-staging', timeoutSeconds: 30, retries: 1, screenshotOnFailure: true, stopOnFirstFailure: false },
    browsers: { enabled: ['chrome', 'firefox', 'safari', 'edge'], headless: true, viewport: '1440x900' },
  };
}

/* ---------- Public entry ---------- */
export function createSeed() {
  const { suites, ids, atlasIds } = seedSuites();
  const testCases = seedTestCases({ ...ids, atlas: atlasIds });
  return {
    projects: seedProjects(),
    environments: seedEnvironments(),
    requirements: seedRequirements(),
    testCases,
    suites,
    executions: seedExecutions(testCases, suites),
    reports: seedReports(),
    notifications: seedNotifications(),
    settings: seedSettings(),
    activeProjectId: P1,
  };
}
