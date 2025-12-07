// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ClinicalTrialManager {
    struct Trial {
        uint256 id;
        string name;
        string description;
        address sponsor;
        uint256 totalBudgetWei;
        bool active;
    }

    struct Patient {
        address wallet;
        uint256 enrolledTrialId;
        uint256 eligibilityScore; // 0–100 from AI
        bool consented;
        string consentIPFS;       // IPFS hash of latest consent JSON
    }

    struct Milestone {
        uint256 id;
        string name;
        uint256 paymentAmountWei;
    }

    uint256 public nextTrialId;

    // Store trials by id
    mapping(uint256 => Trial) public trials;

    // Store patients by wallet
    mapping(address => Patient) public patients;

    event TrialCreated(uint256 indexed trialId, address indexed sponsor);
    event PatientEnrolled(address indexed patient, uint256 indexed trialId, uint256 eligibilityScore);
    event ConsentSubmitted(address indexed patient, uint256 indexed trialId, string ipfsHash);
    event ConsentRevoked(address indexed patient, uint256 indexed trialId);

    function createTrial(
        string memory _name,
        string memory _description,
        uint256 _totalBudgetWei
    ) external {
        uint256 trialId = nextTrialId;
        nextTrialId++;

        Trial memory t = Trial({
            id: trialId,
            name: _name,
            description: _description,
            sponsor: msg.sender,
            totalBudgetWei: _totalBudgetWei,
            active: true
        });

        trials[trialId] = t;

        emit TrialCreated(trialId, msg.sender);
    }

    function enrollPatient(
        address _patient,
        uint256 _trialId,
        uint256 _eligibilityScore
    ) external {
        require(trials[_trialId].active, "Trial not active");
        require(_eligibilityScore <= 100, "Score must be 0-100");

        Patient storage p = patients[_patient];
        p.wallet = _patient;
        p.enrolledTrialId = _trialId;
        p.eligibilityScore = _eligibilityScore;
        // consented stays false until explicit consent

        emit PatientEnrolled(_patient, _trialId, _eligibilityScore);
    }

    function submitConsent(uint256 _trialId, string memory _ipfsHash) external {
        Patient storage p = patients[msg.sender];
        require(p.wallet == msg.sender, "Patient not enrolled");
        require(p.enrolledTrialId == _trialId, "Not enrolled in this trial");

        p.consented = true;
        p.consentIPFS = _ipfsHash;

        emit ConsentSubmitted(msg.sender, _trialId, _ipfsHash);
    }

    function revokeConsent(uint256 _trialId) external {
        Patient storage p = patients[msg.sender];
        require(p.wallet == msg.sender, "Patient not enrolled");
        require(p.enrolledTrialId == _trialId, "Not enrolled in this trial");

        p.consented = false;

        emit ConsentRevoked(msg.sender, _trialId);
    }

    function getTrial(uint256 trialId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory description,
            address sponsor,
            uint256 totalBudgetWei,
            bool active
        )
    {
        Trial storage t = trials[trialId];
        return (
            t.id,
            t.name,
            t.description,
            t.sponsor,
            t.totalBudgetWei,
            t.active
        );
    }
}