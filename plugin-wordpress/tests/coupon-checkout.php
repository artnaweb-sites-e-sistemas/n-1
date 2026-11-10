<?php
// Isolated regression tests: real WC_Discounts and coupon product eligibility;
// WordPress persistence, products and gateway are fixtures. No live purchases.
namespace Automattic\WooCommerce\Utilities {
    class NumberUtil { static function round($n, $p = 0) { return round($n, $p); } }
    class DiscountsUtil {
        static function is_coupon_emails_allowed($emails, $restrictions) {
            foreach ($emails as $email) foreach ($restrictions as $rule) {
                if (fnmatch(strtolower($rule), strtolower($email))) return true;
            }
            return false;
        }
    }
}
namespace Automattic\WooCommerce\Enums { class ProductType { const VARIATION = 'variation'; } }
namespace {
define('ABSPATH', __DIR__);
function add_filter($name, $callback, $priority, $accepted) { $GLOBALS['filters'][$name][]=array($callback,$accepted); }
function apply_filters($name, $value, ...$args) {
    foreach ($GLOBALS['filters'][$name] ?? array() as $filter) {
        $value=call_user_func_array($filter[0],array_slice(array_merge(array($value),$args),0,$filter[1]));
    }
    return $value;
}
function absint($n) { return abs((int) $n); }
function wc_get_price_decimals() { return 2; }
function wc_add_number_precision($n) { return round($n * 100, 2); }
function wc_add_number_precision_deep($n) { return is_array($n) ? array_map('wc_add_number_precision_deep', $n) : wc_add_number_precision($n); }
function wc_remove_number_precision_deep($n) { return is_array($n) ? array_map('wc_remove_number_precision_deep', $n) : $n / 100; }
function wc_remove_number_precision($n) { return $n / 100; }
function wc_get_rounding_precision() { return 4; }
function wp_list_pluck($items, $key) { return array_map(function($i) use ($key) { return $i->$key; }, $items); }
function wc_round_discount($n, $p) { return round($n, $p); }
function get_option($name, $default = false) { return $default; }
function wc_format_coupon_code($s) { return strtolower(trim($s)); }
function sanitize_email($s) { return strtolower(trim($s)); }
function is_email($s) { return filter_var($s, FILTER_VALIDATE_EMAIL); }
function get_user_by($key, $value) { return $GLOBALS['account']; }
function get_userdata($id) { return $GLOBALS['account']; }
function get_current_user_id() { return 0; }
function wp_get_current_user() { return (object) array('user_email' => ''); }
function get_post_status($id) { return 'publish'; }
function get_post_meta($id,$key,$single) { return $GLOBALS['coupon'][$key] ?? array(); }
function wp_get_post_terms($id,$taxonomy,$args) { return array($id+4); }
function __($s, $domain = null) { return $s; }
function esc_html($s) { return $s; }
function esc_html__($s, $domain = null) { return $s; }
function wp_kses($s, $tags) { return $s; }
function wc_price($n) { return (string) $n; }
function wc_get_product_coupon_types() { return array('percent', 'fixed_product'); }
function wc_get_cart_coupon_types() { return array('fixed_cart'); }
function wc_get_product_cat_ids($id) { return $GLOBALS['products'][$id]->categories; }
function wc_get_product($id) { return isset($GLOBALS['products'][$id]) ? $GLOBALS['products'][$id] : false; }
function is_wp_error($v) { return $v instanceof WP_Error; }
class WP_Error {
    public $code, $data;
    function __construct($c, $m, $d = array()) { $this->code = $c; $this->data=$d; }
    function get_error_data() { return $this->data; }
}
class ProductType { const VARIATION = 'variation'; }
class WC_Brands_Brand_Settings_Manager {
    static function get_brand_settings_on_coupon($coupon) { return array('included_brands'=>$GLOBALS['coupon']['product_brands'] ?? array(),'excluded_brands'=>$GLOBALS['coupon']['exclude_product_brands'] ?? array()); }
    static function set_brand_settings_on_coupon($coupon) {}
}
class WC_Product {
    public $id, $price, $sale, $categories;
    function __construct($id, $price, $sale = false, $categories = array(1)) { $this->id=$id; $this->price=$price; $this->sale=$sale; $this->categories=$categories; }
    function get_id() { return $this->id; }
    function get_parent_id() { return 0; }
    function get_price() { return $this->price; }
    function is_on_sale() { return $this->sale; }
    function is_type($type) { return $type === 'simple'; }
    function get_name() { return 'Product '.$this->id; }
}
class WC_Order_Item_Product {
    public $product, $qty, $subtotal;
    function set_product($p) { $this->product=$p; }
    function set_quantity($n) { $this->qty=$n; }
    function set_subtotal($n) { $this->subtotal=$n; }
    function set_total($n) {}
    function get_id() { return 0; }
    function get_product() { return $this->product; }
    function get_quantity() { return $this->qty; }
    function get_subtotal() { return $this->subtotal; }
    function get_subtotal_tax() { return 0; }
}
class WC_Order {
    public $email, $customer_id, $items = array();
    function set_billing_email($s) { $this->email=$s; }
    function set_customer_id($id) { $this->customer_id=$id; }
    function get_customer_id() { return $this->customer_id; }
    function get_billing_email() { return $this->email; }
    function add_item($i) { $this->items[]=$i; }
    function get_items() { return $this->items; }
    function get_prices_include_tax() { return false; }
    function get_subtotal() { return array_sum(array_map(function($i) { return $i->subtotal; },$this->items)); }
}
class CouponStore {
    function get_usage_by_email($c, $email) { return $GLOBALS['guest_usage']; }
    function get_usage_by_user_id($c, $id) { return $GLOBALS['account_usage']; }
    function get_tentative_usage_count($id) { return 0; }
    function get_tentative_usages_for_user($id, $aliases) { return 0; }
}
function method_source($source, $name) {
    $start = strpos($source, 'public function '.$name.'(');
    if ($start === false) $start = strpos($source, 'private function '.$name.'(');
    $open = strpos($source, '{', $start);
    $level=1; $i=$open+1;
    while ($level && $i<strlen($source)) { if($source[$i]==='{') $level++; if($source[$i]==='}') $level--; $i++; }
    return str_replace('private function','public function',substr($source,$start,$i-$start));
}
$base = dirname(__DIR__, 2).'/dist/coupon-tests/';
$native_coupon=file_get_contents($base.'class-wc-coupon.php');
preg_match_all('/const\s+([A-Z_0-9]+)\s*=\s*([0-9]+)\s*;/', $native_coupon, $constants, PREG_SET_ORDER);
$body=''; foreach($constants as $c) $body.='const '.$c[1].' = '.$c[2].';';
$body.=method_source($native_coupon,'is_valid_for_product').method_source($native_coupon,'is_valid_for_cart');
eval('class WC_Coupon { '.$body.'
    function __construct($code) {}
    function __call($name,$args) { return $GLOBALS["coupon"][substr($name,4)] ?? null; }
    function is_type($types) { return in_array($this->get_discount_type(), (array)$types, true); }
    function get_id() { return 1; }
    function get_data_store() { return new CouponStore(); }
    function get_coupon_error($code) { return "Coupon error ".$code; }
    function get_context_based_coupon_errors($code) { return array(); }
}');
require $base.'class-wc-discounts.php';
$plugin=file_get_contents(dirname(__DIR__).'/n1-woocommerce-api.php');
eval('class CouponHarness { '.method_source($plugin,'quote_checkout_coupon').method_source($plugin,'validate_checkout_coupon').' function n1_get_user_id_from_bearer_request() { return 0; } }');
$harness=new CouponHarness(); $checks=0;
function run_quote($changes=array(), $rows=null, $email='buyer@example.com') {
    $GLOBALS['coupon']=array_merge(array('code'=>'teste','discount_type'=>'percent','amount'=>10,'status'=>'publish','virtual'=>false,'minimum_amount'=>0,'maximum_amount'=>0,'product_ids'=>array(),'excluded_product_ids'=>array(),'product_categories'=>array(),'excluded_product_categories'=>array(),'email_restrictions'=>array(),'exclude_sale_items'=>false,'usage_limit'=>0,'usage_count'=>0,'usage_limit_per_user'=>0,'limit_usage_to_x_items'=>null,'date_expires'=>null),$changes);
    return $GLOBALS['harness']->quote_checkout_coupon(array('couponInfo'=>array('couponCode'=>'teste'),'cart'=>$rows ?? array(array('id'=>1,'orderQuantity'=>2),array('id'=>2,'orderQuantity'=>1)),'email'=>$email,'shippingCost'=>7));
}
function expect($condition, $label) { if(!$condition) throw new \Exception('FAIL: '.$label); $GLOBALS['checks']++; }
$products=array(1=>new WC_Product(1,50,false,array(1)),2=>new WC_Product(2,30,true,array(2)));
$account=false; $guest_usage=0; $account_usage=0;
$q=run_quote(); expect($q['discountValue']===13.0 && $q['totalAmount']===124.0,'multiple unsaved lines and quantities');
$q=run_quote(array('product_ids'=>array(1))); expect($q['discountValue']===10.0,'included product only');
$q=run_quote(array('excluded_product_ids'=>array(1))); expect($q['discountValue']===3.0,'excluded product');
$q=run_quote(array('product_categories'=>array(2))); expect($q['discountValue']===3.0,'included category');
$q=run_quote(array('excluded_product_categories'=>array(2))); expect($q['discountValue']===10.0,'excluded category');
$q=run_quote(array('exclude_sale_items'=>true)); expect($q['discountValue']===10.0,'sale products');
expect(is_wp_error(run_quote(array('minimum_amount'=>140))),'minimum spend');
expect(is_wp_error(run_quote(array('maximum_amount'=>120))),'maximum spend');
expect(is_wp_error(run_quote(array('product_ids'=>array(99)))),'ineligible products');
expect(is_wp_error(run_quote(array('email_restrictions'=>array('*@allowed.com')))),'email rejection');
expect(!is_wp_error(run_quote(array('email_restrictions'=>array('*@example.com')))),'wildcard email');
expect(is_wp_error(run_quote(array('usage_limit'=>1,'usage_count'=>1))),'global usage limit');
$guest_usage=1; expect(is_wp_error(run_quote(array('usage_limit_per_user'=>1))),'guest usage limit');
$account=(object)array('ID'=>9,'user_email'=>'buyer@example.com'); $guest_usage=1; $account_usage=1;
expect(is_wp_error(run_quote(array('usage_limit_per_user'=>2))),'combined guest and account usage');
$account=false; $guest_usage=0; $account_usage=0;
$q=run_quote(array('discount_type'=>'fixed_product','amount'=>5)); expect($q['discountValue']===15.0,'fixed product per quantity');
$q=run_quote(array('discount_type'=>'fixed_product','amount'=>5,'limit_usage_to_x_items'=>1)); expect($q['discountValue']===5.0,'item quantity limit');
$q=run_quote(array('discount_type'=>'fixed_cart','amount'=>8)); expect($q['discountValue']===8.0 && $q['totalAmount']===129.0,'fixed cart and shipping');
expect(is_wp_error(run_quote(array('date_expires'=>new DateTimeImmutable('-1 day')))),'expired');
expect(is_wp_error(run_quote(array(),array(array('id'=>999,'orderQuantity'=>1)))),'unknown product fails closed');
expect(is_wp_error(run_quote(array(),null,'')),'email required');
expect($harness->validate_checkout_coupon(array())===true,'no coupon preserved');
expect(is_wp_error($harness->validate_checkout_coupon(array('discount'=>10))),'discount without coupon code rejected');
expect(is_wp_error($harness->validate_checkout_coupon(array('couponInfo'=>array('discountValue'=>10)))),'coupon without code rejected');
require $base.'class-wc-brands-coupons.php';
$q=run_quote(array('product_brands'=>array(5))); expect($q['discountValue']===10.0,'included brand using native brand hooks');
$q=run_quote(array('exclude_product_brands'=>array(5))); expect($q['discountValue']===3.0,'excluded brand using native brand hooks');
expect(is_wp_error(run_quote(array('product_brands'=>array(99)))),'brand absent');
expect(is_wp_error(run_quote(array('discount_type'=>'fixed_cart','exclude_product_brands'=>array(5)))),'fixed cart excluded brand');
echo 'OK: '.$checks." native-engine quote checks (isolated fixtures).\n";

// Gateway sequencing, reservation cleanup and retry tests. Gateway/persistence are simulated.
define('DAY_IN_SECONDS', 86400);
class WP_REST_Request {
    private $data=array();
    function __construct($method) {}
    function set_body($body) { $this->data=json_decode($body,true); }
    function set_header($name,$value) {}
    function get_json_params() { return $this->data; }
}
class WP_REST_Response {
    private $data;
    function __construct($data) { $this->data=$data; }
    function get_data() { return $this->data; }
    function set_data($data) { $this->data=$data; }
}
function rest_ensure_response($data) { return new WP_REST_Response($data); }
function wp_json_encode($data) { return json_encode($data); }
function get_transient($key) { return $GLOBALS['transients'][$key] ?? false; }
function set_transient($key,$value,$ttl) { $GLOBALS['transients'][$key]=$value; }
function delete_transient($key) { unset($GLOBALS['transients'][$key]); }
function wc_get_order($id) { return $GLOBALS['payment_order']; }
function wc_maybe_increase_stock_levels($id) { $GLOBALS['stock_restored']++; }
class TestLocks {
    public $released=0;
    function prepare($sql,$value) { return $sql; }
    function get_var($sql) { if(strpos($sql,'RELEASE_LOCK')!==false) $this->released++; return 1; }
}
class PaymentOrder {
    public $status='pending', $meta=array('_n1_coupon_prepared'=>'yes');
    function get_id() { return 7; }
    function get_total() { return 124; }
    function get_order_key() { return 'secret-key'; }
    function get_meta($key) { return $this->meta[$key] ?? ''; }
    function update_meta_data($key,$value) { $this->meta[$key]=$value; }
    function update_status($status,$note) { $this->status=$status; }
    function add_order_note($note) {}
    function set_payment_method($method) {}
    function set_payment_method_title($title) {}
    function set_transaction_id($id) {}
    function save() {}
    function payment_complete($id) { $this->status='processing'; }
}
eval('class PaymentHarness { '.method_source($plugin,'create_mercado_pago_transparent_payment').method_source($plugin,'recover_coupon_quote').'
    public $prepared=0, $charged=0;
    function quote_checkout_coupon($params) { return $GLOBALS["payment_quote"]; }
    function add_order($request,$prepare) { $this->prepared++; return rest_ensure_response(array("order"=>array("id"=>7))); }
    function verify_payment_confirmed($gateway,$id,$total) { return $GLOBALS["payment_verified"]; }
    function create_mercado_pago_transparent_payment_raw($request) {
        $this->charged++;
        $params=$request->get_json_params();
        if (!empty($params["couponInfo"])) throw new Exception("Must not revalidate reserved coupon against itself");
        return $GLOBALS["payment_result"];
    }
}');
function setup_payment($changes=array()) {
    $GLOBALS['transients']=array();
    $GLOBALS['stock_restored']=0;
    $GLOBALS['wpdb']=new TestLocks();
    $GLOBALS['payment_order']=new PaymentOrder();
    $GLOBALS['payment_quote']=array('couponCode'=>'teste','discountValue'=>13,'totalAmount'=>124);
    $GLOBALS['payment_verified']=true;
    $GLOBALS['payment_result']=rest_ensure_response(array('status'=>'approved','payment'=>array('id'=>'mp-7')));
    $params=array_merge(array('couponInfo'=>array('couponCode'=>'teste'),'checkoutAttempt'=>'abcdef0123456789-attempt','payer_email'=>'buyer@example.com','transaction_amount'=>124,'cart'=>array(array('id'=>1)),'checkout'=>array()),$changes);
    $r=new WP_REST_Request('POST'); $r->set_body(wp_json_encode($params)); return $r;
}
$r=setup_payment(); $gateway=new PaymentHarness();
$response=$gateway->create_mercado_pago_transparent_payment($r);
expect($gateway->prepared===1 && $gateway->charged===1 && $payment_order->status==='processing','reserve before charge');
expect($response->get_data()['checkoutOrder']['id']===7 && $wpdb->released===1,'reference and lock release');
expect($gateway->recover_coupon_quote(array('email'=>'buyer@example.com','checkoutAttempt'=>'abcdef0123456789-attempt','couponInfo'=>array('couponCode'=>'teste')))['totalAmount']===124,'recover own quote after usage reservation');
$gateway->create_mercado_pago_transparent_payment($r);
expect($gateway->prepared===1 && $gateway->charged===1,'duplicate attempt returns cached payment');
$r=setup_payment(); $gateway=new PaymentHarness(); $payment_quote=new WP_Error('invalid_coupon','invalid');
expect(is_wp_error($gateway->create_mercado_pago_transparent_payment($r)) && !$gateway->charged && !$gateway->prepared && $wpdb->released===1,'invalid coupon never charges');
$r=setup_payment(array('transaction_amount'=>1)); $gateway=new PaymentHarness();
expect(is_wp_error($gateway->create_mercado_pago_transparent_payment($r)) && !$gateway->charged,'changed or forged total never charges');
$r=setup_payment(); $gateway=new PaymentHarness(); $payment_result=rest_ensure_response(array('status'=>'rejected','payment'=>array('id'=>'mp-7')));
$gateway->create_mercado_pago_transparent_payment($r); expect($payment_order->status==='failed' && $stock_restored===1,'decline releases native usage and restores stock');
$r=setup_payment(); $gateway=new PaymentHarness(); $payment_result=new WP_Error('bad_request','bad',array('status'=>400));
$gateway->create_mercado_pago_transparent_payment($r); expect($payment_order->status==='failed' && !$transients,'definitive validation error releases attempt');
$r=setup_payment(); $gateway=new PaymentHarness(); $payment_result=new WP_Error('network','timeout',array('status'=>502));
$gateway->create_mercado_pago_transparent_payment($r); expect($payment_order->status==='pending','uncertain payment remains reserved');
$gateway->create_mercado_pago_transparent_payment($r); expect($gateway->charged===1,'uncertain retry does not charge twice');
$r=setup_payment(array('couponInfo'=>null)); $gateway=new PaymentHarness();
$gateway->create_mercado_pago_transparent_payment($r); expect($gateway->prepared===0 && $gateway->charged===1,'no-coupon flow preserved');
echo 'OK: '.$checks." checks total, including payment sequencing and retries.\n";
}
