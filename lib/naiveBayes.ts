import { CustomerType } from "./api";

export type CustomerFeatures = {
  orderCount: number;
  totalSpend: number;
};

type GaussianParams = { mean: number; variance: number };

type ClassParams = {
  prior: number;
  orderCount: GaussianParams;
  totalSpend: GaussianParams;
};

const MODEL: Record<CustomerType, ClassParams> = {
  oneTimePurchase: {
    prior: 0.3333,
    orderCount:    { mean: 0.75,  variance: 0.1875 },
    totalSpend:    { mean: 400,   variance: 1000000 },
  },
  giftOrder: {
    prior: 0.3333,
    orderCount:    { mean: 3,     variance: 0.6667 },
    totalSpend:    { mean: 1200,  variance: 1000000 },
  },
  regularCustomer: {
    prior: 0.3333,
    orderCount:    { mean: 8,     variance: 4 },
    totalSpend:    { mean: 3200,  variance: 1000000 },
  },
};

function gaussianPdf(x: number, { mean, variance }: GaussianParams): number {
  const sigma2 = variance;
  const exponent = -((x - mean) ** 2) / (2 * sigma2);
  return (1 / Math.sqrt(2 * Math.PI * sigma2)) * Math.exp(exponent);
}

function clamp(p: number): number {
  return Math.max(p, 1e-10);
}

export function classifyCustomer(features: CustomerFeatures): {
  customerType: CustomerType;
  confidence: number;
  scores: Record<CustomerType, number>;
} {
  const classes = Object.keys(MODEL) as CustomerType[];

  const logScores: Record<CustomerType, number> = {} as Record<CustomerType, number>;

  for (const cls of classes) {
    const params = MODEL[cls];

    const logPrior = Math.log(params.prior);
    const logOrderCount  = Math.log(clamp(gaussianPdf(features.orderCount,    params.orderCount)));
    const logTotalSpend  = Math.log(clamp(gaussianPdf(features.totalSpend,     params.totalSpend)));

    logScores[cls] = logPrior + logOrderCount + logTotalSpend;
  }

  const maxLog = Math.max(...Object.values(logScores));
  const expScores: Record<CustomerType, number> = {} as Record<CustomerType, number>;
  let sumExp = 0;
  for (const cls of classes) {
    expScores[cls] = Math.exp(logScores[cls] - maxLog);
    sumExp += expScores[cls];
  }
  const probabilities: Record<CustomerType, number> = {} as Record<CustomerType, number>;
  for (const cls of classes) {
    probabilities[cls] = expScores[cls] / sumExp;
  }

  const predicted = classes.reduce((best, cls) =>
    probabilities[cls] > probabilities[best] ? cls : best
  );

  return {
    customerType: predicted,
    confidence: probabilities[predicted],
    scores: probabilities,
  };
}

export function buildCustomerFeatures(orders: {
  totalPrice: number;
}[]): CustomerFeatures {
  const orderCount = orders.length;
  const totalSpend = orders.reduce((s, o) => s + o.totalPrice, 0);

  return { orderCount, totalSpend };
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  oneTimePurchase: "Разова покупка",
  giftOrder: "Подарункове замовлення",
  regularCustomer: "Постійний клієнт",
};

export const REGULAR_CUSTOMER_DISCOUNT = 0.1;

export const DELIVERY_FEE = 200;

export const FREE_DELIVERY_TYPES: CustomerType[] = ["regularCustomer", "giftOrder"];

export function getOrderBenefits(customerType: CustomerType): {
  discount: number;
  freeDelivery: boolean;
} {
  return {
    discount: customerType === "regularCustomer" ? REGULAR_CUSTOMER_DISCOUNT : 0,
    freeDelivery: FREE_DELIVERY_TYPES.includes(customerType),
  };
}
