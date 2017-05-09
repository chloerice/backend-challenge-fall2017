const router = require('express').Router();
const requestPromise = require('request-promise');
const Promise = require('bluebird');

let orders = [];
let remainingCookies = 0;

module.exports = router
  .get('/orders', (req, res, next) => {
    const allRequests = [{
      uri: 'https://backend-challenge-fall-2017.herokuapp.com/orders.json',
      qs: {
        page: 1
      },
      User_Agent: 'Chloe Rice',
      json: true
    }, {
      uri: 'https://backend-challenge-fall-2017.herokuapp.com/orders.json',
      qs: {
        page: 2
      },
      User_Agent: 'Chloe Rice',
      json: true
    }, {
      uri: 'https://backend-challenge-fall-2017.herokuapp.com/orders.json',
      qs: {
        page: 3
      },
      User_Agent: 'Chloe Rice',
      json: true
    }]

    // here we make all three requests to the order API, then sort the results
    Promise.map(allRequests, (request) => {
      return requestPromise(request)
      .then(results => {
        remainingCookies = results.available_cookies;
        return results.orders
      })
    })
    .then(allResults => {
      allResults.forEach(result => {
        orders = orders.concat(result)
      })
      orders.sort((orderA, orderB) => orderA.id - orderB.id)
      res.status(200).json(orders)
    })
    .catch(next)
  })

  .get('/orders/processed', (req, res, next) => {
    const fulfilled = [];
    const skipped = [];
    // only process orders that haven't been fulfilled, that request cookies,
    // and whose requested cookie amount is not > the remaining cookie count
    let ordersToProcess = orders.filter(order => {
      // if order has not yet been fulfilled
      if (!order.fulfilled) {
        // if the order requests cookies
        if (order.products[0].title === 'Cookie' || order.products[1].title === 'Cookie') {
          const product = order.products[0].title === 'Cookie'
            ? order.products[0]
            : order.products[1]
          // if the cookie order amount isn't greater than the number available
          if (product.amount <= remainingCookies) {
            return true
          } else {
            // keep track of unfulfilled but skipped orders for later
            skipped.push(order)
            return false
          }
        }
        // order doesn't need cookies, so we fulfill it
        order.fulfilled = true
      }
      fulfilled.push(order)
      return false
    });

    const cookieOrderIndexes = {};
    let productA, productB;

    // sort descending by order amount, ascending by id for any of same amount
    ordersToProcess.sort((orderA, orderB) => {
      // we first grab the index of the cookie product of each order so
      // we can subtract the right amount from remainingCookies on line 111
      orderA.products[0].title === 'Cookie'
        ? cookieOrderIndexes[orderA.id] = 0
        : cookieOrderIndexes[orderA.id] = 1

      orderB.products[0].title === 'Cookie'
        ? cookieOrderIndexes[orderB.id] = 0
        : cookieOrderIndexes[orderB.id] = 1

      productA = orderA.products[cookieOrderIndexes[orderA.id]];
      productB = orderB.products[cookieOrderIndexes[orderB.id]];
      // if we're comparing orders requesting the same number of cookies,
      // the earlier order gets processed first
      if ((productB.amount - productA.amount) === 0) {
        return productA.id - productB.id
      } else {
        return productB.amount - productA.amount
      }
    })

    // fulfill the cookie orders that we can according to requirements
    let i = 0;
    while (remainingCookies > 0) {
      let currentOrder = ordersToProcess[i++];
      let index = cookieOrderIndexes[currentOrder.id];
      remainingCookies -= currentOrder.products[index].amount;
    }

    // the unfulfilled orders are the the ones at indexes from where i left off onward,
    // plus the skipped orders that needed more cookies than were left sorted ascending
    res.json({
      remaining_cookies: 0,
      unfulfilled_orders: [
        ...ordersToProcess.slice(i).map(order => order.id),
        ...skipped.map(order => order.id)
      ].sort((a, b) => a - b)
    });
  })
