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
