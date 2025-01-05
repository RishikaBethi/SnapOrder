import { useGetRestaurant } from "@/api/RestaurantApi";
import MenuItem from "@/components/MenuItem";
import OrderSummary from "@/components/OrderSummary";
import RestaurantInfo from "@/components/RestaurantInfo";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { MenuItem as MenuItemType } from "../types";
import CheckoutButton from "@/components/CheckoutButton";
// import { UserFormData } from "@/forms/user-profile-form/UserProfileForm";
import { useCreateCheckoutSession } from "@/api/OrderApi";
import RazorpayPayment from "@/components/Razorpay";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
};

const DetailPage = () => {
  const { user } = useAuth0();
  const [totalCost, setTotalCost] = useState(0);
  const [OrderId, setOrderId] = useState(null);
  const { restaurantId } = useParams();
  const { restaurant, isLoading } = useGetRestaurant(restaurantId);
  const { createCheckoutSession, isLoading: isCheckoutLoading } =
    useCreateCheckoutSession();
  
    const [isModalOpen, setModalOpen] = useState(false);
    const handleOpenModal = async () => {
      if (!restaurant) {
        console.log("yo");
        return;
      }
      if(!user) {
        return;
      }
      const checkoutData = {
        cartItems: cartItems.map((cartItem) => ({
          menuItemId: cartItem._id,
          name: cartItem.name,
          quantity: cartItem.quantity.toString(),
        })),
        restaurantId: restaurant._id,
        deliveryDetails: {
          name: user.name || "100",
          addressLine1: "100",
          city: "100",
          email: user.email || "100",
        },
      };
      const data = await createCheckoutSession(checkoutData);
      setTotalCost(data.totalCost);
      setOrderId(data.orderId);
      setModalOpen(true);
    }
    const handleCloseModal = () => setModalOpen(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const storedCartItems = sessionStorage.getItem(`cartItems-${restaurantId}`);
    return storedCartItems ? JSON.parse(storedCartItems) : [];
  });

  const addToCart = (menuItem: MenuItemType) => {
    setCartItems((prevCartItems) => {
      const existingCartItem = prevCartItems.find(
        (cartItem) => cartItem._id === menuItem._id
      );

      let updatedCartItems;

      if (existingCartItem) {
        updatedCartItems = prevCartItems.map((cartItem) =>
          cartItem._id === menuItem._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        updatedCartItems = [
          ...prevCartItems,
          {
            _id: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
          },
        ];
      }

      sessionStorage.setItem(
        `cartItems-${restaurantId}`,
        JSON.stringify(updatedCartItems)
      );

      return updatedCartItems;
    });
  };

  const removeFromCart = (cartItem: CartItem) => {
    setCartItems((prevCartItems) => {
      const updatedCartItems = prevCartItems.filter(
        (item) => cartItem._id !== item._id
      );

      sessionStorage.setItem(
        `cartItems-${restaurantId}`,
        JSON.stringify(updatedCartItems)
      );

      return updatedCartItems;
    });
  };

  // const onCheckout = async (userFormData: UserFormData) => {
  //   if (!restaurant) {
  //     return;
  //   }

  //   const checkoutData = {
  //     cartItems: cartItems.map((cartItem) => ({
  //       menuItemId: cartItem._id,
  //       name: cartItem.name,
  //       quantity: cartItem.quantity.toString(),
  //     })),
  //     restaurantId: restaurant._id,
  //     deliveryDetails: {
  //       name: userFormData.name,
  //       addressLine1: userFormData.addressLine1,
  //       city: userFormData.city,
  //       country: userFormData.country,
  //       email: userFormData.email as string,
  //     },
  //   };

  //   const data = await createCheckoutSession(checkoutData);
  //   window.location.href = data.url;
  // };

  if (isLoading || !restaurant) {
    return "Loading...";
  }

  return (
    <div className="flex flex-col gap-10">
      <AspectRatio ratio={16 / 5}>
        <img
          src={restaurant.imageUrl}
          className="rounded-md object-cover h-full w-full"
        />
      </AspectRatio>
      <div className="grid md:grid-cols-[4fr_2fr] gap-5 md:px-32">
        <div className="flex flex-col gap-4">
          <RestaurantInfo restaurant={restaurant} />
          <span className="text-2xl font-bold tracking-tight">Menu</span>
          {restaurant.menuItems.map((menuItem) => (
            <MenuItem
              menuItem={menuItem}
              addToCart={() => addToCart(menuItem)}
            />
          ))}
        </div>

        <div>
          <Card>
            <OrderSummary
              restaurant={restaurant}
              cartItems={cartItems}
              removeFromCart={removeFromCart}
            />
            <CardFooter>
              <CheckoutButton
                disabled={cartItems.length === 0}
                onCheckout={handleOpenModal}
                isLoading={isCheckoutLoading}
              />
            </CardFooter>
          </Card>
        </div>
      </div>

        <div>
        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Checkout</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <RazorpayPayment onClose={handleCloseModal} totalCost={totalCost} order_id={OrderId}/>
            </Card>
          </div>
        )}
      </div>
      </div>
  );
};

export default DetailPage;
