/* Citywide Google Ads measurement. No customer form values are sent to Google. */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', 'AW-16693027016');
  gtag('config', 'AW-16693027016/rNdYCLb5_bEdEMjB7Zc-', {
    phone_conversion_number: '443-578-1686'
  });

  // These are engagement events, not proof of a connected call or paid booking.
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('a,button');
    if (!target) return;
    if (target.matches('a[href^="tel:"]')) {
      gtag('event', 'citywide_phone_click', {transport_type: 'beacon'});
    }
    if (target.matches('[data-booking-open],a[href*="book.stripe.com"]')) {
      gtag('event', 'citywide_booking_start', {transport_type: 'beacon'});
    }
  });

  // Existing forms hand off to SMS or payment, so observe them as secondary actions.
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form.matches('#booking-form,#car-key-form') || !form.checkValidity()) return;
    if (form.id === 'booking-form') {
      var date = form.elements.date;
      if (date && date.min && date.value < date.min) return;
    }
    gtag('event', 'conversion', {
      send_to: 'AW-16693027016/I4RjCK22orIdEMjB7Zc-',
      value: 0,
      currency: 'USD',
      transport_type: 'beacon'
    });
  }, true);
})();
