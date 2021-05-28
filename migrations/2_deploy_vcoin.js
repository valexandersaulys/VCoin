const VCoin = artifacts.require("VCoin");

module.exports = function (deployer) {
  deployer.deploy(VCoin);
};
