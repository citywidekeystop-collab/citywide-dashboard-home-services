/* Citywide Google Ads measurement. Never send customer form fields to Google. */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', 'AW-16693027016');
  gtag('config', 'AW-16693027016/rNdYCLb5_bEdEMjB7Zc-', {
    phone_conversion_number: '443-578-1686'
  });

  // Engagement events are not counted as completed calls or appointments.
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('a,button');
    if (!target) return;
    if (target.matches('a[href^="tel:"]')) {
      gtag('event', 'citywide_phone_click', { transport_type: 'beacon' });
    }
    if (target.matches('[data-booking-open],a[href*="book.stripe.com"]')) {
      gtag('event', 'citywide_booking_start', { transport_type: 'beacon' });
    }
  });

  // AJAX quote forms dispatch this event only AFTER /api/citywide/quote succeeds.
  document.addEventListener('citywide:quote-submitted', function () {
    gtag('event', 'citywide_quote_submitted', { transport_type: 'beacon' });
  });

  // Called only after the server verifies a paid Stripe Checkout session.
  // Keep the existing conversion label; its Google Ads action still needs
  // verification in account 688-013-2960 before reporting can be relied on.
  window.citywideTrackConfirmedBooking = function (sessionId) {
    if (typeof sessionId !== 'string' || !/^cs_(test_|live_)[A-Za-z0-9_]+$/.test(sessionId)) return;
    gtag('event', 'citywide_booking_paid', {
      value: 25.0,
      currency: 'USD',
      transaction_id: sessionId,
      transport_type: 'beacon'
    });
    gtag('event', 'conversion', {
      send_to: 'AW-16693027016/I4RjCK22orIdEMjB7Zc-',
      value: 25.0,
      currency: 'USD',
      transaction_id: sessionId,
      transport_type: 'beacon'
    });
  };
})();
