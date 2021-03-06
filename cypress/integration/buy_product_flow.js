/* eslint-disable */

import { register, viewPortSizes, getRandomEmail, getRandomPw } from "../support/utils"


describe('Buy Product Flow', function () {
    viewPortSizes.forEach(viewport => {

        describe(`Tests for ${viewport.viewportWidth} w x ${viewport.viewportHeight} h`, function () {
            let emailArg = ''
            let pwArg = getRandomPw()


            beforeEach(() => {
                cy.viewport(viewport.viewportWidth, viewport.viewportHeight)
            })



            describe('Register new user', function () {
                emailArg = getRandomEmail();

                register(true, viewport.desktop, emailArg, pwArg);

            })



            describe('Selecting & Buying product', function () {
                it('selects a category', function () {
                    cy.pickCategory(viewport.desktop)
                })


                it('selects a product & adds to cart', function () {
                    cy.get('.listing-wrp .listing-item .product-card')
                        .should('be.visible')
                        .pickRandomProduct()


                    cy.contains('Add to Cart').click()


                    cy.contains('Successfully added item to cart.')
                    cy.contains('Shopping Cart')
                    cy.contains('Keep shopping')
                })



                it('goes to shopping cart & goes to checkout', function () {
                    cy.contains('Shopping Cart')
                        .should('exist')
                        .click()


                    cy.url()
                        .should('include', '/checkout/cart')
                        .wait(800)


                    cy.contains('Go to checkout')
                        .should('exist')
                        .click()


                    cy.url()
                        .should('include', '/checkout/shopware-onepage')
                })



                it('selects a payment method', function () {
                    cy.get('.payment-methods-wrp .method-wrp').then($paymentMethods => {
                        cy.wrap($paymentMethods)
                            .should('have.length', $paymentMethods.length)
                            .pickRandom()
                    })
                })



                it('selects a shipping method', function () {
                    cy.get('.shipping-methods-wrp .method-wrp').then($shippingMethods => {
                        cy.wrap($shippingMethods)
                            .should('have.length', $shippingMethods.length)
                            .pickRandom()
                    })
                })



                it('places order', function () {
                    cy.get('button')
                        .contains('Place Order')
                        .click()
                })



                it('gets success message', function () {
                    cy.url().should('include', '/checkout/shopware-success')

                    cy.contains('Thank you for your order at hubble!')
                })
            })
        })
    })
})

