import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  buildSelectionShareMessage,
  SelectionShareCustomer,
  SelectionShareItem,
} from "@/src/features/map/services/mapShareFormatterService";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { emailService } from "@/src/services/emailService";
import { sharingService } from "@/src/services/sharingService";
import { useAppStore } from "@/src/store/appStore";
import { OrderWithItems } from "@/src/types/order";
import { ProductTotal } from "@/src/types/productTotal";
import { formatError } from "@/src/utils/formatError";
import { buildProductTotals } from "@/src/utils/orderItemTotals";

import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";

type UseCitySelectionActionsOptions = {
  selectedCustomers: CityCustomerItem[];
  reload: () => Promise<void>;
};

export function useCitySelectionActions({ selectedCustomers, reload }: UseCitySelectionActionsOptions) {
  const { t } = useTranslation("cities");
  const { products } = useProducts();
  const shopName = useAppStore((state) => state.shopName);
  const shareIncludeAddress = useAppStore((state) => state.shareIncludeAddress);
  const shareIncludePhone = useAppStore((state) => state.shareIncludePhone);
  const shareIncludeTotals = useAppStore((state) => state.shareIncludeTotals);
  const [sharing, setSharing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const productEmojiById = useMemo(
    () => new Map(products.map((product) => [product.id, product.emoji])),
    [products],
  );
  const selectedCustomerIds = useMemo(
    () => selectedCustomers.map((customer) => customer.id),
    [selectedCustomers],
  );
  const selectedOpenCustomerCount = useMemo(
    () => selectedCustomers.filter((customer) => customer.status === "open").length,
    [selectedCustomers],
  );

  const loadOrders = useCallback(async () => {
    if (!selectedCustomerIds.length) {
      return [] as OrderWithItems[];
    }

    return orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(selectedCustomerIds);
  }, [selectedCustomerIds]);

  const share = useCallback(async () => {
    setActionError(null);
    setSharing(true);

    try {
      const message = await buildSelectionMessage({
        loadOrders,
        productEmojiById,
        selectedCustomers,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
      });

      if (!message) {
        setActionError(t("selectionActions.noCustomersSelected"));
        return;
      }

      await sharingService.shareText(message);
    } catch (error) {
      setActionError(formatError(error).message);
    } finally {
      setSharing(false);
    }
  }, [loadOrders, productEmojiById, selectedCustomers, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, shopName, t]);

  const shareByEmail = useCallback(async () => {
    setActionError(null);
    setEmailing(true);

    try {
      const message = await buildSelectionMessage({
        loadOrders,
        productEmojiById,
        selectedCustomers,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
      });

      if (!message) {
        setActionError(t("selectionActions.noCustomersSelected"));
        return;
      }

      await emailService.compose(shopName?.trim() || t("selectionActions.defaultEmailSubject"), message);
    } catch (error) {
      setActionError(formatError(error).message);
    } finally {
      setEmailing(false);
    }
  }, [loadOrders, productEmojiById, selectedCustomers, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, shopName, t]);

  const completeAllOpenOrders = useCallback(async () => {
    setActionError(null);
    setCompletingAll(true);

    try {
      const orders = await loadOrders();

      if (!orders.length) {
        setActionError(t("selectionActions.noOpenOrdersSelected"));
        return false;
      }

      await Promise.all(orders.map((order) => orderRepository.completeOrder(order.id)));
      await reload();
      return true;
    } catch (error) {
      setActionError(formatError(error).message);
      return false;
    } finally {
      setCompletingAll(false);
    }
  }, [loadOrders, reload, t]);

  return {
    sharing,
    emailing,
    completingAll,
    actionError,
    selectedOpenCustomerCount,
    clearActionError: () => setActionError(null),
    share,
    shareByEmail,
    completeAllOpenOrders,
  };
}

async function buildSelectionMessage({
  loadOrders,
  productEmojiById,
  selectedCustomers,
  shareIncludeAddress,
  shareIncludePhone,
  shareIncludeTotals,
  shopName,
}: {
  loadOrders: () => Promise<OrderWithItems[]>;
  productEmojiById: Map<string, string | undefined>;
  selectedCustomers: CityCustomerItem[];
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  shopName: string;
}) {
  const orders = await loadOrders();

  return buildSelectionShareMessage(
    buildShareCustomers(selectedCustomers, orders, productEmojiById),
    enrichTotalsWithEmoji(buildProductTotals(orders), productEmojiById),
    {
      includeAddress: shareIncludeAddress,
      includePhone: shareIncludePhone,
      includeTotal: shareIncludeTotals,
      shopName,
    },
  );
}

function buildShareCustomers(
  selectedCustomers: CityCustomerItem[],
  orders: OrderWithItems[],
  productEmojiById: Map<string, string | undefined>,
): SelectionShareCustomer[] {
  const ordersByCustomerId = new Map<string, OrderWithItems[]>();

  orders.forEach((order) => {
    ordersByCustomerId.set(order.customerId, [...(ordersByCustomerId.get(order.customerId) ?? []), order]);
  });

  return selectedCustomers.map((customer) => {
    const customerOrders = ordersByCustomerId.get(customer.id) ?? [];

    return {
      fullName: customer.fullName,
      address: customer.address,
      phone: customer.phone,
      city: customer.city,
      orderCount: customerOrders.length,
      items: customerOrders.flatMap((order) =>
        order.items.map((item) => ({
          productName: item.productNameSnapshot,
          quantity: item.quantity,
          unit: item.unit,
          emoji: productEmojiById.get(item.productId),
        })),
      ),
    };
  });
}

function enrichTotalsWithEmoji(
  totals: ProductTotal[],
  productEmojiById: Map<string, string | undefined>,
): SelectionShareItem[] {
  return totals.map((total) => ({
    productName: total.productName,
    quantity: total.quantity,
    unit: total.unit,
    emoji: productEmojiById.get(total.productKey.split(":")[0]),
  }));
}
