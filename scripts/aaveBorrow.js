const { getNamedAccounts } = require("hardhat");
const { getWeth, AMOUNT } = require("./getWeth");

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.provider.getSigner();

  // get LendingPool
  const lendingPool = await getLendingPool(signer);
  console.log(`LendingPool address ${lendingPool.target}`);

  // deposit
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  await approveErc20(wethTokenAddress, lendingPool.target, AMOUNT, signer);
  console.log("Depositing....");
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log("Desposited!");

  // borrow
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );
  const daiPrice = await getDaiPrice();
  const amountDaiToBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / Number(daiPrice));
  const amountDaiToBorrowWei = ethers.parseEther(amountDaiToBorrow.toString());
  console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`);
  await borrowDai(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    lendingPool,
    amountDaiToBorrowWei,
    deployer
  );
  await getBorrowUserData(lendingPool, deployer);

  // repay
  await repay(
    amountDaiToBorrowWei,
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    lendingPool,
    deployer,
    signer
  );
}

async function repay(amount, daiAddress, lendingPool, account, signer) {
  await approveErc20(daiAddress, lendingPool.target, amount, signer);
  const repayTx = await lendingPool.repay(daiAddress, amount, 2, account);
  await repayTx.wait(1);
  console.log("Repaid!");
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrow, account) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrow,
    2,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log("You've borrowed!");
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price.toString()}`);
  return price;
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`);
  return { availableBorrowsETH, totalDebtETH };
}

async function approveErc20(erc20Address, spenderAddress, amount, signer) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, signer);
  txResponse = await erc20Token.approve(spenderAddress, amount);
  await txResponse.wait(1);
  console.log("Approved!");
}

async function getLendingPool(account) {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account
  );
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );
  return lendingPool;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
