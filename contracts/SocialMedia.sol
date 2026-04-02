// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SocialMedia
 * @dev A decentralized social media platform with profiles, posts, likes/dislikes, comments, following, and messaging.
 */
contract SocialMedia is ReentrancyGuard, Ownable {
    struct User {
        string username;
        string bio;
        string profilePic; // IPFS hash or URL for profile picture
        uint256 totalPosts;
        uint256 totalTipsReceived;
        bool registered;
        uint256 followersCount;
        uint256 followingCount;
    }

    struct Post {
        uint256 id;
        address author;
        string content;
        string imageHash;
        uint256 likesCount;
        uint256 dislikesCount;
        uint256 tipAmount;
        uint256 timestamp;
    }

    struct Comment {
        address author;
        string content;
        uint256 timestamp;
    }

    struct Message {
        address sender;
        address receiver;
        string content;
        uint256 timestamp;
    }

    // Mapping from address to User profile
    mapping(address => User) public users;
    // Mapping from post ID to Post
    mapping(uint256 => Post) public posts;
    // Mapping to track if a user liked a post: postId => userAddress => liked
    mapping(uint256 => mapping(address => bool)) public postLikes;
    // Mapping to track if a user disliked a post: postId => userAddress => disliked
    mapping(uint256 => mapping(address => bool)) public postDislikes;
    // Mapping from post ID to array of Comments
    mapping(uint256 => Comment[]) public postComments;
    
    // Following system: followerAddress => followingAddress => isFollowing
    mapping(address => mapping(address => bool)) public isFollowing;
    
    // Messaging system: userAddress => otherUserAddress => array of Messages
    mapping(address => mapping(address => Message[])) private privateMessages;
    // Keep track of users who have chatted with each other for UI
    mapping(address => address[]) public chatHistory;
    mapping(address => mapping(address => bool)) private chatExists;

    // Array of all post IDs for easy iteration/pagination
    uint256[] public postIds;
    uint256 public postCount;

    // Events
    event UserRegistered(address indexed userAddress, string username, string profilePic);
    event PostCreated(uint256 indexed postId, address indexed author, string content, string imageHash);
    event PostLiked(uint256 indexed postId, address indexed user);
    event PostUnliked(uint256 indexed postId, address indexed user);
    event PostDisliked(uint256 indexed postId, address indexed user);
    event PostUndisliked(uint256 indexed postId, address indexed user);
    event PostTipped(uint256 indexed postId, address indexed tipper, address indexed author, uint256 amount);
    event CommentAdded(uint256 indexed postId, address indexed author, string content);
    event UserFollowed(address indexed follower, address indexed following);
    event UserUnfollowed(address indexed follower, address indexed following);
    event MessageSent(address indexed sender, address indexed receiver, string content);
    event PostDeleted(uint256 indexed postId);

    /**
     * @dev Constructor sets the owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registers a new user or updates existing profile.
     */
    function registerUser(string memory _username, string memory _bio, string memory _profilePic) external {
        require(bytes(_username).length > 0, "Username cannot be empty");
        
        users[msg.sender].username = _username;
        users[msg.sender].bio = _bio;
        users[msg.sender].profilePic = _profilePic;
        
        if (!users[msg.sender].registered) {
            users[msg.sender].registered = true;
        }
        emit UserRegistered(msg.sender, _username, _profilePic);
    }

    /**
     * @dev Creates a new post.
     */
    function createPost(string memory _content, string memory _imageHash) external {
        require(users[msg.sender].registered, "User not registered");
        require(bytes(_content).length > 0, "Content cannot be empty");

        postCount++;
        posts[postCount] = Post({
            id: postCount,
            author: msg.sender,
            content: _content,
            imageHash: _imageHash,
            likesCount: 0,
            dislikesCount: 0,
            tipAmount: 0,
            timestamp: block.timestamp
        });

        postIds.push(postCount);
        users[msg.sender].totalPosts++;

        emit PostCreated(postCount, msg.sender, _content, _imageHash);
    }

    /**
     * @dev Deletes a post (only by author).
     */
    function deletePost(uint256 _postId) external {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(posts[_postId].author == msg.sender, "Only author can delete");
        
        delete posts[_postId];
        // Note: In a production app, you might want to remove it from postIds array too
        // but for simplicity we'll just check if author is address(0) when fetching.
        
        emit PostDeleted(_postId);
    }

    /**
     * @dev Toggles like for a post.
     */
    function toggleLike(uint256 _postId) external {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(users[msg.sender].registered, "User not registered");

        if (postLikes[_postId][msg.sender]) {
            // Unlike
            postLikes[_postId][msg.sender] = false;
            posts[_postId].likesCount--;
            emit PostUnliked(_postId, msg.sender);
        } else {
            // If already disliked, undislike first
            if (postDislikes[_postId][msg.sender]) {
                postDislikes[_postId][msg.sender] = false;
                posts[_postId].dislikesCount--;
                emit PostUndisliked(_postId, msg.sender);
            }
            postLikes[_postId][msg.sender] = true;
            posts[_postId].likesCount++;
            emit PostLiked(_postId, msg.sender);
        }
    }

    /**
     * @dev Toggles dislike for a post.
     */
    function toggleDislike(uint256 _postId) external {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(users[msg.sender].registered, "User not registered");

        if (postDislikes[_postId][msg.sender]) {
            // Undislike
            postDislikes[_postId][msg.sender] = false;
            posts[_postId].dislikesCount--;
            emit PostUndisliked(_postId, msg.sender);
        } else {
            // If already liked, unlike first
            if (postLikes[_postId][msg.sender]) {
                postLikes[_postId][msg.sender] = false;
                posts[_postId].likesCount--;
                emit PostUnliked(_postId, msg.sender);
            }
            postDislikes[_postId][msg.sender] = true;
            posts[_postId].dislikesCount++;
            emit PostDisliked(_postId, msg.sender);
        }
    }

    /**
     * @dev Adds a comment to a post.
     */
    function addComment(uint256 _postId, string memory _content) external {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(users[msg.sender].registered, "User not registered");
        require(bytes(_content).length > 0, "Comment cannot be empty");

        postComments[_postId].push(Comment({
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp
        }));

        emit CommentAdded(_postId, msg.sender, _content);
    }

    /**
     * @dev Tips the author of a post.
     */
    function tipPost(uint256 _postId) external payable nonReentrant {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(msg.value > 0, "Tip amount must be greater than zero");
        
        Post storage post = posts[_postId];
        address author = post.author;
        
        require(author != msg.sender, "Cannot tip your own post");

        post.tipAmount += msg.value;
        users[author].totalTipsReceived += msg.value;

        // Transfer funds to author
        (bool success, ) = payable(author).call{value: msg.value}("");
        require(success, "Tip transfer failed");

        emit PostTipped(_postId, msg.sender, author, msg.value);
    }

    /**
     * @dev Follows a user.
     */
    function followUser(address _userToFollow) external {
        require(users[msg.sender].registered, "User not registered");
        require(users[_userToFollow].registered, "Target user not registered");
        require(_userToFollow != msg.sender, "Cannot follow yourself");
        require(!isFollowing[msg.sender][_userToFollow], "Already following");

        isFollowing[msg.sender][_userToFollow] = true;
        users[msg.sender].followingCount++;
        users[_userToFollow].followersCount++;

        emit UserFollowed(msg.sender, _userToFollow);
    }

    /**
     * @dev Unfollows a user.
     */
    function unfollowUser(address _userToUnfollow) external {
        require(isFollowing[msg.sender][_userToUnfollow], "Not following");

        isFollowing[msg.sender][_userToUnfollow] = false;
        users[msg.sender].followingCount--;
        users[_userToUnfollow].followersCount--;

        emit UserUnfollowed(msg.sender, _userToUnfollow);
    }

    /**
     * @dev Sends a private message to another user.
     */
    function sendMessage(address _receiver, string memory _content) external {
        require(users[msg.sender].registered, "User not registered");
        require(users[_receiver].registered, "Receiver not registered");
        require(bytes(_content).length > 0, "Message cannot be empty");

        Message memory newMessage = Message({
            sender: msg.sender,
            receiver: _receiver,
            content: _content,
            timestamp: block.timestamp
        });

        privateMessages[msg.sender][_receiver].push(newMessage);
        privateMessages[_receiver][msg.sender].push(newMessage);

        // Update chat history
        if (!chatExists[msg.sender][_receiver]) {
            chatHistory[msg.sender].push(_receiver);
            chatExists[msg.sender][_receiver] = true;
        }
        if (!chatExists[_receiver][msg.sender]) {
            chatHistory[_receiver].push(msg.sender);
            chatExists[_receiver][msg.sender] = true;
        }

        emit MessageSent(msg.sender, _receiver, _content);
    }

    /**
     * @dev Returns comments for a post.
     */
    function getComments(uint256 _postId) external view returns (Comment[] memory) {
        return postComments[_postId];
    }

    /**
     * @dev Returns private messages with another user.
     */
    function getMessages(address _otherUser) external view returns (Message[] memory) {
        return privateMessages[msg.sender][_otherUser];
    }

    /**
     * @dev Returns user's chat history (addresses).
     */
    function getChatHistory() external view returns (address[] memory) {
        return chatHistory[msg.sender];
    }

    /**
     * @dev Returns post details.
     */
    function getPost(uint256 _postId) external view returns (
        address author,
        string memory content,
        string memory imageHash,
        uint256 likesCount,
        uint256 dislikesCount,
        uint256 tipAmount,
        uint256 timestamp
    ) {
        Post storage post = posts[_postId];
        return (
            post.author,
            post.content,
            post.imageHash,
            post.likesCount,
            post.dislikesCount,
            post.tipAmount,
            post.timestamp
        );
    }

    /**
     * @dev Returns a slice of posts for pagination.
     */
    function getPosts(uint256 _fromIndex, uint256 _toIndex) external view returns (Post[] memory) {
        require(_fromIndex <= _toIndex, "Invalid range");
        require(_toIndex < postIds.length, "Index out of bounds");

        uint256 range = _toIndex - _fromIndex + 1;
        Post[] memory result = new Post[](range);

        for (uint256 i = 0; i < range; i++) {
            uint256 postId = postIds[postIds.length - 1 - (_fromIndex + i)];
            result[i] = posts[postId];
        }

        return result;
    }

    /**
     * @dev Returns user profile.
     */
    function getUser(address _user) external view returns (
        string memory username,
        string memory bio,
        string memory profilePic,
        uint256 totalPosts,
        uint256 totalTipsReceived,
        bool registered,
        uint256 followersCount,
        uint256 followingCount
    ) {
        User storage user = users[_user];
        return (
            user.username,
            user.bio,
            user.profilePic,
            user.totalPosts,
            user.totalTipsReceived,
            user.registered,
            user.followersCount,
            user.followingCount
        );
    }

    function getTotalPosts() external view returns (uint256) {
        return postIds.length;
    }
}
