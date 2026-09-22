import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/stores/cartStore";
import { useListingStore } from "@/stores/listingStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

const Cart = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { items: cartItems, removeItem: removeFromCart, clearCart, updateQuantity } = useCartStore();
    const { listings, listingItems } = useListingStore();

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    const userCartItems = cartItems;

    // Populate denormalized data if missing
    const enrichedCartItems = userCartItems.map(ci => ({
        ...ci,
        item: ci.item || listingItems.find(li => li.id === ci.itemId),
        master: ci.master || listings.find(l => l.id === ci.masterId)
    }));

    const calculateSubtotal = () => {
        return enrichedCartItems.reduce((sum, ci) => {
            const price = ci.item?.pricing.price.amount || 0;
            let qty = ci.quantity || 1;

            // Handle rental duration
            if (ci.master?.type === 'RENTAL' && ci.rentalStart && ci.rentalEnd) {
                const days = Math.max(1, Math.ceil((new Date(ci.rentalEnd).getTime() - new Date(ci.rentalStart).getTime()) / (1000 * 60 * 60 * 24)));
                qty *= days;
            } else if (ci.master?.type === 'CONSULTATION' && ci.consultHours) {
                qty *= ci.consultHours;
            }

            return sum + (price * qty);
        }, 0);
    };

    const calculatePlatformFee = (subtotal: number) => {
        return Math.floor(subtotal * 0.05); // 5% platform fee
    };

    const subtotal = calculateSubtotal();
    const platformFee = calculatePlatformFee(subtotal);
    const total = subtotal + platformFee;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount / 100);
    };

    const handleUpdateQuantity = (cartItem: any, delta: number) => {
        const newQuantity = cartItem.quantity + delta;
        if (newQuantity <= 0) {
            removeFromCart(cartItem.id);
        } else {
            updateQuantity(cartItem.id, newQuantity);
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    return (
        <div className="min-h-screen bg-background pb-32">
            <Header />

            <div className="container max-w-4xl py-8 px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-extrabold">{currentUser.id ? 'My Cart' : '购物车'}</h1>
                    {enrichedCartItems.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (confirm('Clear cart?')) clearCart();
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {enrichedCartItems.length === 0 ? (
                    <div className="text-center py-20">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Your cart is empty</p>
                        <Button
                            onClick={() => navigate('/')}
                            className="btn-action"
                        >
                            Explore services
                        </Button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {enrichedCartItems.map((cartItem) => {
                                const item = cartItem.item;
                                const master = cartItem.master;

                                if (!item || !master) return null;

                                return (
                                    <div key={cartItem.id} className="card-warm p-4">
                                        <div className="flex gap-4">
                                            <img
                                                src={master.images[0]}
                                                alt={master.titleZh}
                                                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => navigate(`/service/${master.id}`)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className="font-bold text-lg mb-1 line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                                                    onClick={() => navigate(`/service/${master.id}`)}
                                                >
                                                    {master.titleZh}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <span className="text-sm text-muted-foreground line-clamp-1">
                                                        {item.nameZh}
                                                    </span>
                                                    {cartItem.rentalStart && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 rounded-full flex items-center">
                                                            📅 {new Date(cartItem.rentalStart).toLocaleDateString()} - {new Date(cartItem.rentalEnd!).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {cartItem.consultHours && (
                                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 rounded-full flex items-center">
                                                            ⏱️ {cartItem.consultHours} hrs
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-lg font-bold text-primary">
                                                        {formatMoney(item.pricing.price.amount)}
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            /{item.pricing.unit}
                                                        </span>
                                                    </p>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                                                            <button
                                                                onClick={() => handleUpdateQuantity(cartItem, -1)}
                                                                className="w-7 h-7 rounded-full bg-card hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                                                                disabled={cartItem.quantity <= 1}
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="w-8 text-center font-semibold">
                                                                {cartItem.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => handleUpdateQuantity(cartItem, 1)}
                                                                className="w-7 h-7 rounded-full bg-card hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeFromCart(cartItem.id)}
                                                            className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Price Summary */}
                        <div className="lg:col-span-1">
                            <div className="card-warm p-6 sticky top-20">
                                <h3 className="font-bold text-lg mb-4">订单摘要</h3>

                                <div className="space-y-3 mb-4 pb-4 border-b border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">商品小计</span>
                                        <span className="font-semibold">{formatMoney(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">平台服务费 (5%)</span>
                                        <span className="font-semibold">{formatMoney(platformFee)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-lg">合计</span>
                                    <span className="text-2xl font-extrabold text-primary">
                                        {formatMoney(total)}
                                    </span>
                                </div>

                                <Button
                                    onClick={handleCheckout}
                                    className="w-full btn-action mb-3"
                                >
                                    去结算 ({enrichedCartItems.length})
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    满意后自动转账，支持7天无理由退款
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Cart;
