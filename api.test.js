const supertest = require('supertest-as-promised');
const app = require('./index');
const {expect} = require('chai');

const orders = require('./orders.json').orders;

describe('Order Fulfillment', () => {

  describe('`/orders` API call', () => {

    it('GET responds with the entire list of orders', () => {
      return supertest(app)
      .get('/orders')
      .expect(200)
      .expect('Content-type', /json/)
      .expect(res => {
        expect(res.body).to.have.length(11);
      });
    });

    it('PUT responds with a json object which has: the remaining cookie count and an ascending list of unfulfilled cookie orders', () => {
      return supertest(app)
      .get('/orders/processed')
      .expect(200)
      .expect(res => {
        expect(res.body.remaining_cookies).to.equal(0);
        expect(res.body.unfulfilled_orders).to.eql([7, 8, 11]);
      })
    });

  });

});
