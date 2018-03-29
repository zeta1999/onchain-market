const Marketplace = artifacts.require('./Marketplace.sol');
const EscrowAgent = artifacts.require('./EscrowAgent.sol');

contract('given a marketplace contract', function(accounts) {
    let marketplace;
	let escrowAgent;

    let seller = accounts[1];
    let buyer = accounts[2];

    beforeEach('setup a new contract', async function() {
        escrowAgent = await EscrowAgent.new();
        marketplace = await Marketplace.new(escrowAgent.address)
    });

	describe('when a listing is created', async function() {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		it('then set the listing mapped to the listing hash to exist', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.isTrue(result[0]);
		});

		it('then set the mapped listing seller to the msg sender', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.equal(result[1], seller);
		});

		it('then set the mapped listing name to the name specified', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.equal(result[2], "item2");
		});

		it('then set the mapped listing price to the price specified', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.equal(result[3], web3.toWei(0.02, "ether"));
		});

		it('then set the mapped listing index to the last in the listingIndex', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.equal(result[4].toNumber(), 1);
		});

		it('then the escrowHash is set to the default zero address', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.equal(result[5], 0x0000000000000000000000000000000000000000000000000000000000000000);
		});

		it('then the delivery information is an empty string', async function() {
			const result = await marketplace.getListing.call(listingHash);

			assert.equal(result[6], "");
		});

		it('then the listing index is added to the listingsByUser mapping', async function () {
			const result = await marketplace.getListingIndexForUserByIndex.call(seller, 1);

			assert.equal(result.toNumber(), 1);
		})
	});

	describe('when isListing is called', async function() {
		describe('for a listing that exists', async function() {
			beforeEach('create a listing', async function() {
				const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
				listingHash = transactionHash.logs[0].args.listingHash;
			});

			it('then return true', async function () {
				const result = await marketplace.isListing.call(listingHash, {from: buyer});

				assert.isTrue(result);
			})
		});

		describe('for a listing that does not exist', async function() {
			it('then return false', async function () {
				const result = await marketplace.isListing.call(listingHash, {from: buyer});

				assert.isFalse(result);
			})
		});
	});

	describe('when getListingAtIndex is called', async function() {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		it('with an invalid index then it throws', async function () {
			try {
				await marketplace.getListingAtIndex.call(5);
			} catch (error) {
				assert.equal(error.name, "Error")
			}
		});

		it('with a valid index then it returns the correct listing index', async function () {
			let result = await marketplace.getListingAtIndex.call(1);

			assert.equal(result, listingHash);
		})
	});

	describe('when getListing is called', async function() {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		it('with a listing hash for an unused entry then it throws', async function () {
			try {
				await marketplace.getListing.call(0x0000000000000000000000000000000000000000000000000000000000000000);
			} catch (error) {
				assert.equal(error.name, "Error")
			}
		});

		describe("with a valid listing hash", function () {
			it('then it returns the correct listing seller', async function () {
				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[1], seller);
			});

			it('then it returns the correct listing name', async function () {
				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[2], "item2");
			});

			it('then it returns the correct listing price', async function () {
				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[3], web3.toWei(0.02, "ether"));
			});

			it('then it returns the correct listing index', async function () {
				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[4].toNumber(), 1);
			});

			it('then it returns the correct listing escrow hash', async function () {
				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[5], 0x0000000000000000000000000000000000000000000000000000000000000000);
			});

			it('then it returns the correct listing delivery information', async function () {
				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[6], "");
			});
		});
	});

	describe('when getListingCount is called', function () {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		it('then it returns the correct index length', async function () {
			let result = await marketplace.getListingCount.call();

			assert.equal(result, 2);
		})
	});

	describe('when getListingCount is called', function () {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		it('for a user with no listings then 0 is returned', async function () {
			let result = await marketplace.getUserListingCount.call(buyer);

			assert.equal(result, 0);
		});

		it('for a user with listings then the correct count is returned', async function () {
			let result = await marketplace.getUserListingCount.call(seller);

			assert.equal(result, 2);
		});
	});

	describe('when getListingIndexForUserByIndex', function () {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		it('with an invalid index for the specified user then it throws', async function () {
			try {
				await marketplace.getListingIndexForUserByIndex.call(buyer, 2);
			} catch (error) {
				assert.equal(error.name, "Error");
			}
		});

		it('with a valid index the specified user then it returns the correct listing index', async function () {
			let result = await marketplace.getListingIndexForUserByIndex.call(seller, 1);

			assert.equal(result, 1);
		})
	});

	describe('when a listing is purchased', function () {
		let listingHash;

		beforeEach('create a couple of listings', async function() {
			await marketplace.addListing("item1", web3.toWei(0.01, "ether"), {from: seller});

			const transactionHash = await marketplace.addListing("item2", web3.toWei(0.02, "ether"), {from: seller});
			listingHash = transactionHash.logs[0].args.listingHash;
		});

		describe('that exists', function () {
			it('but with not enough ether the it throws', async function (){
				try {
					await marketplace.purchaseListing(listingHash, "", {from: buyer, value: web3.toWei(0.01, "ether")});
				} catch (error) {
					assert.equal(error.name, "StatusError");
				}
			});

			it('then it creates an escrow', async function () {
				await marketplace.purchaseListing(listingHash, "", {from: buyer, value: web3.toWei(0.02, "ether")})

				let escrowEvent;
				await escrowAgent.allEvents().get(function (err, events) {
					escrowEvent = events.filter(entry => entry.event == "CreatedEscrow");

					assert.isDefined(escrowEvent[0])
				});
			});

			it('then it sets the mapped escrow hash to the one created', async function () {
				await marketplace.purchaseListing(listingHash, "", {from: buyer, value: web3.toWei(0.02, "ether")});

				let result = await marketplace.getListing.call(listingHash);

				let escrowEvent;
				return escrowAgent.allEvents().get(function (err, events) {
					escrowEvent = events.filter(entry => entry.event == "CreatedEscrow");

					assert.equal(result[5], escrowEvent[0].args.escrowHash)
				});
			});

			it('then it sets the mapped delivery information to the value passed in', async function () {
				await marketplace.purchaseListing(listingHash, "test", {from: buyer, value: web3.toWei(0.02, "ether")});

				let result = await marketplace.getListing.call(listingHash);

				assert.equal(result[6], "test");
			});

			it('then it sets the listing available bool to false', async function () {
				await marketplace.purchaseListing(listingHash, "", {from: buyer, value: web3.toWei(0.02, "ether")});

				let result = await marketplace.getListing.call(listingHash);

				assert.isFalse(result[0]);
			});

			it('then it emits a ListingPurchased event', async function () {
				let transactionHash = await marketplace.purchaseListing(listingHash, "", {from: buyer, value: web3.toWei(0.02, "ether")})

				assert.equal(transactionHash.logs[0].event, "ListingPurchased");
			});
		});

		describe('that does not exist', function () {
			it('then it throws', async function () {
				try {
					await marketplace.purchaseListing(0x0000000000000000000000000000000000000000000000000000000000000000, "");
				} catch (error) {
					assert.equal(error.name, "StatusError");
				}
			});
		});
	});
});