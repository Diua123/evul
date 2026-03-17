
export const notificationService = {
  // Solicitar permissão ao usuário
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Enviar notificação
  send: async (title: string, body: string, icon: string = 'https://cdn-icons-png.flaticon.com/512/2995/2995620.png') => {
    if (Notification.permission === 'granted') {
      const options = {
        body: body,
        icon: icon,
        badge: 'https://cdn-icons-png.flaticon.com/512/2995/2995620.png', // Ícone pequeno monocromático para barra android
        vibrate: [200, 100, 200], // Vibrar: som, pausa, som
        tag: 'ev-ul-notification',
        renotify: true,
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      };

      // Tenta usar o Service Worker para notificação persistente (barra de status)
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          registration.showNotification(title, options);
        } else {
          // Fallback para notificação web padrão se SW não estiver pronto
          new Notification(title, options);
        }
      } catch (e) {
        console.error('Erro ao enviar notificação via SW', e);
        new Notification(title, options);
      }
    }
  }
};
