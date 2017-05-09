const supertest = require('supertest-as-promised');
const app = require('./index');
const {expect} = require('chai');

describe('Order Fulfillment', () => {

  describe('/orders', () => {

    it('GET responds with a json object which has: the remaining cookie count and an ascending list of unfulfilled cookie orders', () => {
      return supertest(app)
      .get('/orders')
      .expect(200)
      .expect('Content-type', /json/)
      .expect(res => {
        expect(res.body.remaining_cookies).to.equal(0);
        expect(res.body.unfulfilled_orders).to.have.length(3);
        expect(res.body.unfulfilled_orders).to.eql([7, 8, 11]);
      });
    });

  });

});
