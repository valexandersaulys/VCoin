pragma solidity =0.8.0;

import "./interfaces/IERC20.sol";

contract VCoin is IERC20 {

    // are events automatically declared?
    
    string private _name = "VCoin";
    string private _symbol = "VC";
    uint8 private _decimals = 8;  // default 'uint' is 'uint256'
    uint256 private _totalSupply = 1000000; // million

    mapping(address => uint256) private _accountToBalance;
    mapping(address => mapping(address => uint256)) private _accountToApprovals;

    constructor() {
        _accountToBalance[msg.sender] = _totalSupply;
        // should take the name, symbol, initial supply, firstMan values
        // can then be crated with `VCoin.new(name, symbol, supply, firstMan)`
    }

    function name() public override view returns (string memory) {
        return _name;
    }
    function symbol() public override view returns (string memory) {
        return _symbol;
    }
    function decimals() public override view returns (uint8) {
        return _decimals;
    }
    function totalSupply() public override view returns (uint256) {
        return _totalSupply;
    }

    
    function balanceOf(address _owner) public override view returns (uint256 balance) {
        return _accountToBalance[_owner];
    }

    function approve(address _spender, uint256 _value)
        public
        override
        returns (bool success) {
        if (_accountToBalance[msg.sender] < _value)
            return false;
        _accountToApprovals[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _accountToApprovals[msg.sender][_spender]);
        return true;
    }

    function allowance(address _owner, address _spender)
        public
        override
        view
        returns (uint256 remaining) {
        return _accountToApprovals[_owner][_spender];
    }
    
    function transfer(address _to, uint256 _value)
        public
        override
        returns (bool success) {
        return transferFrom(msg.sender, _to, _value);
    }
    
    function transferFrom(address _from, address _to, uint256 _value)
        public
        override
        returns (bool success) {
        require(_accountToBalance[_from] >= _value, "Not enough funds to transfer");
        if(msg.sender != _from || _accountToApprovals[_from][_to] < _value)
            return false;
        // in the past we needed to worry about buffer overflows
        // but since Solidity 0.8.0 we do not        
        _accountToBalance[_from] -= _value;
        _accountToBalance[_to] += _value;
        emit Transfer(_from, _to, _value);
        _accountToApprovals[_from][_to] -= _value;
        return true;
    }
}
