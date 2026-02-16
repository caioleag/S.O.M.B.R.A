self.addEventListener('push', (event) => {
  let payload = { title: 'S.O.M.B.R.A', body: 'Nova atualizacao da operacao.', data: {} }

  try {
    if (event.data) payload = event.data.json()
  } catch (_error) {
    // no-op
  }

  const title = payload.title || 'S.O.M.B.R.A'
  const options = {
    body: payload.body || 'Nova atualizacao da operacao.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-round-128.png',
    data: payload.data || {},
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const operationId = event.notification?.data?.operationId
  const targetUrl = operationId ? `/operations/${operationId}?tab=feed` : '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
      return undefined
    })
  )
})

