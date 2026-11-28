<?php
// Isolated regression tests for the actual plugin methods. WordPress/WooCommerce
// persistence and is_on_sale() are fixtures; no live store or purchases are used.
define('ABSPATH', __DIR__);
define('N1_WOOCOMMERCE_API_LOADED', true);
define('OBJECT', 'OBJECT');
function wc_placeholder_img_src() { return 'placeholder.jpg'; }
function wp_get_post_terms($id, $taxonomy, $args) { return array(); }
function get_post_meta($id, $key, $single) { return ''; }
function home_url($path) { return 'https://example.test' . $path; }
function wpautop($text) { return $text; }
function get_page_by_title($title, $output, $types) { return null; }
function get_page_by_path($path, $output, $types) { return null; }
function sanitize_title($title) { return strtolower($title); }
function wc_get_product($id) { return $GLOBALS['products'][$id] ?? null; }
function rest_ensure_response($data) { return $data; }
function wp_reset_postdata() {}
function get_the_ID() { return $GLOBALS['current_product_id']; }
class WooCommerce {}
class WP_Query {
    private $ids, $index = 0;
    function __construct($args) { $this->ids = array_keys($GLOBALS['products']); }
    function have_posts() { return $this->index < count($this->ids); }
    function the_post() { $GLOBALS['current_product_id'] = $this->ids[$this->index++]; }
}
class WC_Product {
    public $id, $regular, $sale, $stored, $start, $end;
    public static $now;
    function __construct($id, $regular, $sale, $stored, $start = null, $end = null) {
        $this->id = $id; $this->regular = $regular; $this->sale = $sale;
        $this->stored = $stored; $this->start = $start; $this->end = $end;
    }
    function get_id() { return $this->id; }
    function get_regular_price() { return $this->regular; }
    function get_sale_price() { return $this->sale; }
    function get_price() { return $this->stored; }
    // Contract fixture for WooCommerce's date-aware sale predicate.
    function is_on_sale() {
        return $this->sale !== '' && $this->regular > $this->sale
            && ($this->start === null || $this->start <= self::$now)
            && ($this->end === null || $this->end >= self::$now);
    }
    function get_slug() { return 'book-' . $this->id; }
    function get_name() { return 'Book ' . $this->id; }
    function get_image_id() { return 0; }
    function get_gallery_image_ids() { return array(); }
    function get_date_created() { return null; }
    function is_in_stock() { return true; }
    function is_featured() { return false; }
    function get_total_sales() { return 0; }
    function get_description() { return ''; }
    function get_short_description() { return ''; }
    function get_sku() { return 'BOOK'; }
    function get_stock_quantity() { return 10; }
    function get_average_rating() { return 0; }
    function get_rating_count() { return 0; }
}
class OrderItem {
    function get_product() { return $GLOBALS['products'][1]; }
    function get_quantity() { return 2; }
    function get_total() { return 150; }
    function get_subtotal() { return 160; }
    function get_name() { return 'Previously purchased book'; }
}
class WC_Order {
    function get_id() { return 7; }
    function get_items($type = '') { return $type === 'fee' ? array() : array(new OrderItem()); }
    function __call($name, $args) { return ''; }
}

require isset($argv[1]) ? $argv[1] : dirname(__DIR__) . '/n1-woocommerce-api.php';
$plugin = (new ReflectionClass('N1_WooCommerce_API'))->newInstanceWithoutConstructor();
function invoke_plugin($name, ...$args) {
    $method = new ReflectionMethod('N1_WooCommerce_API', $name);
    $method->setAccessible(true);
    return $method->invokeArgs($GLOBALS['plugin'], $args);
}
$checks = 0;
function expect_same($actual, $expected, $label) {
    if ($actual !== $expected) {
        throw new Exception($label . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
    $GLOBALS['checks']++;
}

// Midnight in Sao Paulo is 03:00 UTC. PHP runs in UTC like a typical server.
date_default_timezone_set('UTC');
$start = (new DateTimeImmutable('2026-11-28 00:00:00', new DateTimeZone('America/Sao_Paulo')))->getTimestamp();
$end = (new DateTimeImmutable('2026-11-29 23:59:59', new DateTimeZone('America/Sao_Paulo')))->getTimestamp();
$scenarios = array(
    'before start, stale sale in _price' => array($start - 1, '60', 100.0, 0),
    'at start, cron has not updated _price' => array($start, '100', 60.0, 40),
    'during promotion' => array($start + 3600, '60', 60.0, 40),
    'last second of final day' => array($end, '60', 60.0, 40),
    'after end, cron has not restored _price' => array($end + 1, '60', 100.0, 0),
);
foreach ($scenarios as $label => $scenario) {
    list(WC_Product::$now, $stored, $expected, $discount) = $scenario;
    $product = new WC_Product(1, '100', '60', $stored, $start, $end);
    $GLOBALS['products'] = array(1 => $product);
    foreach (array(true, false) as $lite) {
        $formatted = invoke_plugin('format_product', $product, $lite);
        expect_same($formatted['price'], $expected, $label . ' storefront price');
        expect_same($formatted['discount'], $discount ? (float) $discount : 0, $label . ' storefront discount');
    }
    expect_same(invoke_plugin('calculate_cart_amount_server_side', array(array('id' => 1, 'price' => 1, 'orderQuantity' => 2)), array('shippingCost' => 7)), $expected * 2 + 7, $label . ' server checkout');
    expect_same(invoke_plugin('n1_get_cart_item_unit_price', array('price' => 1, 'discount' => 99), $product), $expected, $label . ' shipping base');
    $discounted = $plugin->get_discount_products(array());
    expect_same(count($discounted['products']), $discount ? 1 : 0, $label . ' discount listing');
}

WC_Product::$now = $start + 1;
foreach (array(
    array('no sale', '100', '', null, null, 100.0),
    array('unscheduled sale', '100', '60', null, null, 60.0),
    array('start only, future', '100', '60', $end, null, 100.0),
    array('start only, active', '100', '60', $start, null, 60.0),
    array('end only, active', '100', '60', null, $end, 60.0),
    array('end only, expired', '100', '60', null, $start, 100.0),
    array('zero price promotion', '100', '0', null, null, 0.0),
    array('sale above regular', '100', '120', null, null, 100.0),
    array('sale equals regular', '100', '100', null, null, 100.0),
    array('no regular price fallback', '', '', null, null, 30.0),
) as $scenario) {
    list($label, $regular, $sale, $from, $to, $expected) = $scenario;
    expect_same(invoke_plugin('get_current_product_price', new WC_Product(1, $regular, $sale, '30', $from, $to)), $expected, $label);
}

// Revisiting an old order must not substitute the product's current sale price.
$GLOBALS['products'] = array(1 => new WC_Product(1, '100', '60', '60'));
$history = invoke_plugin('format_order', new WC_Order());
expect_same($history['cart'][0]['price'], 80.0, 'historical price before separately reported coupon');
expect_same($history['cart'][0]['discount'], 20.0, 'historical product discount');
echo 'OK: ' . $checks . " scheduled-price regression checks (isolated fixtures).\n";
