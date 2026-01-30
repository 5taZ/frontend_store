// ... (начало файла остается без изменений до userData)

// В initializeApp изменить userData:
const userData: User = {
  id: dbUser.id,
  username: dbUser.username,
  isAdmin: dbUser.is_admin
  // Убраны balance, referrals, referralLink
};

// В placeOrder добавить удаление товаров из каталога:
const placeOrder = useCallback(async () => {
  if (!user || cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  try {
    const dbOrder = await api.createOrder(user.id, cart, total);
    
    const newOrder: Order = {
      id: dbOrder.id.toString(),
      userId: dbOrder.user_id, // Важно: используем id из ответа бэкенда
      username: user.username,
      items: [...cart],
      totalAmount: total,
      status: OrderStatus.PENDING,
      date: new Date(dbOrder.created_at).getTime()
    };

    // СРАЗУ УДАЛЯЕМ ТОВАРЫ ИЗ КАТАЛОГА (резервирование)
    const itemIdsToRemove = cart.map(item => item.id);
    setProducts(prev => prev.filter(p => !itemIdsToRemove.includes(p.id)));

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    
    await refreshOrders();
  } catch (error) {
    console.error('Failed to place order:', error);
    throw error;
  }
}, [user, cart, refreshOrders]);

// В processOrder исправить логику возврата:
const processOrder = useCallback(async (orderId: string, approved: boolean) => {
  if (!isAdmin) {
    throw new Error('Only admin can process orders');
  }
  
  try {
    const status = approved ? 'CONFIRMED' : 'CANCELED';
    await api.updateOrderStatus(orderId, status);
    
    if (!approved) {
      // ОТМЕНА: Возвращаем товары в каталог
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Получаем полные данные товаров из заказа
        // Важно: нужно восстановить товары в setProducts
        // Но так как у нас нет полных данных (image, desc), нужно получить их с бэкенда или хранить иначе
        
        // Вариант: помечаем как доступные через API (бэкенд должен вернуть товары)
        // Или загружаем заново все продукты:
        const productsData = await api.getProducts();
        setProducts(productsData.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description,
          category: p.category,
          inStock: p.in_stock
        })));
      }
    }
    // При подтверждении ничего не делаем - товары уже удалены из каталога при создании заказа
    
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: approved ? OrderStatus.CONFIRMED : OrderStatus.CANCELED }
          : order
      )
    );
    
    await refreshOrders();
  } catch (error) {
    console.error('Failed to process order:', error);
    throw error;
  }
}, [isAdmin, refreshOrders, orders]);

// ... (остальное без изменений)
