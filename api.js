const router = require('express').Router();
const requestPromise = require('request-promise');
const Promise = require('bluebird');

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

    let orders = [];
    let remainingCookies = 0;
    let skipped = [];
    let cookieOrderIndexes = {};

    Promise.map(allRequests, (request) => {
      // make all three data requests to the order API
      return requestPromise(request)
      .then(results => {
        remainingCookies = results.available_cookies;
        return results.orders
      })
    })
    .then(allResults => {
      // then consolidate the results
      allResults.forEach(result => {
        orders = [...orders, ...result]
      })
      // widdle the order list down to the ones that can be processed right now
      orders = orders.filter(order => {
        if (order.fulfilled) return false;
        else if (order.products[0].title !== 'Cookie' && order.products[1].title !== 'Cookie') {
          return false
        } else {
          // find which product is the cookie order
          order.products[0].title === 'Cookie'
            ? cookieOrderIndexes[order.id] = 0
            : cookieOrderIndexes[order.id] = 1
          const product = order.products[cookieOrderIndexes[order.id]]
          // if the amount ordered isn't > the number available, it can stay
          if (product.amount <= remainingCookies) {
            return true
          } else {
            // otherwise keep track of unfulfilled but skipped orders for later
            skipped.push(order)
            return false
          }
        }
      })
      // sort the cookie orders to determine which should be processed first
      // higher order amounts get priority
      // if amounts are the same, the earlier order gets processed first
      orders.sort((orderA, orderB) => {
        let productA = orderA.products[cookieOrderIndexes[orderA.id]];
        let productB = orderB.products[cookieOrderIndexes[orderB.id]];

        if ((productB.amount - productA.amount) === 0) {
          return productA.id - productB.id
        } else {
          return productB.amount - productA.amount
        }
      })

      // fulfill the cookie orders until we're out of cookies
      let i = 0;
      while (remainingCookies > 0) {
        let currentOrder = orders[i++];
        let index = cookieOrderIndexes[currentOrder.id];
        remainingCookies -= currentOrder.products[index].amount;
      }

      // unfulfilled orders are at indexes from where 'i' left off onward,
      // plus the skipped orders that needed more cookies than were available
      res.json({
        remaining_cookies: 0,
        unfulfilled_orders: [
          ...orders.slice(i),
          ...skipped
        ].map(order => order.id)
        .sort((a, b) => a - b)
      });
    })
    .catch(next)
  })
