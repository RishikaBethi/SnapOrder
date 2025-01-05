// import Stripe from "stripe";
// import { Request, Response } from "express";
// import Restaurant, { MenuItemType } from "../models/restaurant";
// import Order from "../models/order";

// const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
// const FRONTEND_URL = process.env.FRONTEND_URL as string;
// const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId, status: { $ne: "placed" } })
      .populate("restaurant")
      .populate("user");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

// type CheckoutSessionRequest = {
//   cartItems: {
//     menuItemId: string;
//     name: string;
//     quantity: string;
//   }[];
//   deliveryDetails: {
//     email: string;
//     name: string;
//     addressLine1: string;
//     city: string;
//   };
//   restaurantId: string;
// };

// const stripeWebhookHandler = async (req: Request, res: Response) => {
//   let event;

//   try {
//     const sig = req.headers["stripe-signature"];
//     event = STRIPE.webhooks.constructEvent(
//       req.body,
//       sig as string,
//       STRIPE_ENDPOINT_SECRET
//     );
//   } catch (error: any) {
//     console.log(error);
//     return res.status(400).send(`Webhook error: ${error.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     const order = await Order.findById(event.data.object.metadata?.orderId);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.totalAmount = event.data.object.amount_total;
//     order.status = "paid";

//     await order.save();
//   }

//   res.status(200).send();
// };

// const createCheckoutSession = async (req: Request, res: Response) => {
//   try {
//     const checkoutSessionRequest: CheckoutSessionRequest = req.body;

//     const restaurant = await Restaurant.findById(
//       checkoutSessionRequest.restaurantId
//     );

//     if (!restaurant) {
//       throw new Error("Restaurant not found");
//     }

//     const newOrder = new Order({
//       restaurant: restaurant,
//       user: req.userId,
//       status: "placed",
//       deliveryDetails: checkoutSessionRequest.deliveryDetails,
//       cartItems: checkoutSessionRequest.cartItems,
//       createdAt: new Date(),
//     });

//     const lineItems = createLineItems(
//       checkoutSessionRequest,
//       restaurant.menuItems
//     );

//     const session = await createSession(
//       lineItems,
//       newOrder._id.toString(),
//       restaurant.deliveryPrice,
//       restaurant._id.toString()
//     );

//     if (!session.url) {
//       return res.status(500).json({ message: "Error creating stripe session" });
//     }

//     await newOrder.save();
//     res.json({ url: session.url });
//   } catch (error: any) {
//     console.log(error);
//     res.status(500).json({ message: error.raw.message });
//   }
// };

// const createLineItems = (
//   checkoutSessionRequest: CheckoutSessionRequest,
//   menuItems: MenuItemType[]
// ) => {
//   const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
//     const menuItem = menuItems.find(
//       (item) => item._id.toString() === cartItem.menuItemId.toString()
//     );

//     if (!menuItem) {
//       throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
//     }

//     const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
//       price_data: {
//         currency: "gbp",
//         unit_amount: menuItem.price,
//         product_data: {
//           name: menuItem.name,
//         },
//       },
//       quantity: parseInt(cartItem.quantity),
//     };

//     return line_item;
//   });

//   return lineItems;
// };

// const createSession = async (
//   lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
//   orderId: string,
//   deliveryPrice: number,
//   restaurantId: string
// ) => {
//   const sessionData = await STRIPE.checkout.sessions.create({
//     line_items: lineItems,
//     shipping_options: [
//       {
//         shipping_rate_data: {
//           display_name: "Delivery",
//           type: "fixed_amount",
//           fixed_amount: {
//             amount: deliveryPrice,
//             currency: "gbp",
//           },
//         },
//       },
//     ],
//     mode: "payment",
//     metadata: {
//       orderId,
//       restaurantId,
//     },
//     success_url: `${FRONTEND_URL}/order-status?success=true`,
//     cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
//   });

//   return sessionData;
// };

// export default {
//   getMyOrders,
//   createCheckoutSession,
//   stripeWebhookHandler,
// };


import Razorpay from "razorpay";
import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";
import { appendFile } from "fs";
import bodyParser from "body-parser";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID as string;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET as string;
const FRONTEND_URL = process.env.FRONTEND_URL as string;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

type CheckoutSessionRequest = {
  cartItems: {
    menuItemId: string;
    name: string;
    quantity: string;
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine1: string;
    city: string;
  };
  restaurantId: string| undefined;
};

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;

    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    );

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const newOrder = new Order({
      restaurant: restaurant,
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      createdAt: new Date(),
    });

    const totalAmount = calculateTotalAmount(
      checkoutSessionRequest,
      restaurant.menuItems
    );

    // // Create Razorpay order
    // const razorpayOrder = await razorpay.orders.create({
    //   amount: totalAmount * 100, // Convert to paise
    //   currency: "INR",
    //   receipt: newOrder._id.toString(),
    // });

    // newOrder.razorpayOrderId = razorpayOrder.id;
    newOrder.totalAmount = totalAmount;
    await newOrder.save();

    res.json({totalCost: totalAmount, orderId: newOrder._id});
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const razorpayWebhookHandler = async (req: Request, res: Response) => {
  // const signature = req.headers["x-razorpay-signature"];
  // const body = JSON.stringify(req.body);
  try{
    const {payload} = req.body;
    console.log(JSON.stringify(payload));
    const razorpay_order_id=payload.payment.entity.order_id;
    const order = await Order.findOne({ razorpayOrderId:razorpay_order_id });
    if(!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    order.status = "paid";
    await order.save();
  }
  // try {
  //   // Verify signature
  //   const isValid = Razorpay.validateWebhookSignature(
  //     body,
  //     signature as string,
  //     process.env.RAZORPAY_WEBHOOK_SECRET as string
  //   );

  //   if (!isValid) {
  //     return res.status(400).json({ message: "Invalid webhook signature" });
  //   }

  //   if (req.body.event === "payment.captured") {
  //     const razorpayOrderId = req.body.payload.payment.entity.order_id;

  //     const order = await Order.findOne({ razorpayOrderId });

  //     if (!order) {
  //       return res.status(404).json({ message: "Order not found" });
  //     }

  //     order.status = "paid";
  //     await order.save();
  //   }

  //   res.status(200).send();
  // } 
  catch (error: any) {
    console.log(error);
    res.status(500).send(`Webhook error: ${error.message}`);
  }
};

const calculateTotalAmount = (
  checkoutSessionRequest: CheckoutSessionRequest,
  menuItems: MenuItemType[]
) => {
  let totalAmount = 0;

  for (const cartItem of checkoutSessionRequest.cartItems) {
    const menuItem = menuItems.find(
      (item) => item._id.toString() === cartItem.menuItemId.toString()
    );

    if (!menuItem) {
      throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
    }

    totalAmount += menuItem.price * parseInt(cartItem.quantity);
  }

  return totalAmount;
};

// Route to create a Razorpay order
const makePayment = async (req: Request, res: Response) => {
  const { amount, orderId } = req.body;

  const options = {
    amount: amount*100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`, // Unique receipt ID
  };

  try {
    const order = await razorpay.orders.create(options);
    // const user = await User.findOne({ userId });
    // await redisClient.set(order.id, userId,{EX:10*60});
    // const user = await User.findOne({ userId });

    // user.balance += amount;
    // await user.save();
    const order1 = await Order.findOne({ _id:orderId });
    if (!order1) {
      return res.status(404).json({ message: "Order not found" });
    }
    order1.razorpayOrderId = order.id;
    // order1.status = "paid";
    await order1.save();
    res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

export default { getMyOrders, createCheckoutSession, razorpayWebhookHandler, makePayment };
