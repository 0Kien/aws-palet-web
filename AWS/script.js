
       let users = [
            { id: 1, name: 'Demo User', email: 'demo@art.com', password: 'demo123' }
        ];
        let posts = [];
        let currentUser = null;
        let postType = null;
        let likes = [];
        let follows = [];
        let feedUpdateTimer = null;

        // Auth Functions
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = user;
                showMainApp();
            } else {
                alert('Invalid credentials. Try demo@art.com / demo123');
            }
        });

        document.getElementById('signupForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const newUser = {
                id: users.length + 1,
                name: document.getElementById('signupName').value,
                email: document.getElementById('signupEmail').value,
                password: document.getElementById('signupPassword').value
            };
            
            if (users.find(u => u.email === newUser.email)) {
                alert('Email already exists');
                return;
            }
            
            users.push(newUser);
            currentUser = newUser;
            showMainApp();
        });

        function showLogin() {
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('signupPage').classList.add('hidden');
        }

        function showSignup() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('signupPage').classList.remove('hidden');
        }

        function logout() {
            currentUser = null;
            document.getElementById('mainApp').classList.add('hidden');
            showLogin();
        }

        function showMainApp() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('signupPage').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
            
            loadFeed();
        }

        // Post Functions
        function selectType(type) {
            if (postType === type) {
                postType = null;
                document.getElementById('saleBtn').classList.remove('active');
                document.getElementById('bidBtn').classList.remove('active');
                document.getElementById('priceSection').classList.add('hidden');
                document.getElementById('bidSection').classList.add('hidden');
            } else {
                postType = type;
                document.getElementById('saleBtn').classList.remove('active');
                document.getElementById('bidBtn').classList.remove('active');
                document.getElementById('priceSection').classList.add('hidden');
                document.getElementById('bidSection').classList.add('hidden');
                
                if (type === 'sale') {
                    document.getElementById('saleBtn').classList.add('active');
                    document.getElementById('priceSection').classList.remove('hidden');
                } else {
                    document.getElementById('bidBtn').classList.add('active');
                    document.getElementById('bidSection').classList.remove('hidden');
                }
            }
        }

        function createPost() {
            const content = document.getElementById('postContent').value;
            if (!content.trim()) {
                alert('Please write something');
                return;
            }

            const post = {
                id: posts.length + 1,
                authorId: currentUser.id,
                authorName: currentUser.name,
                content: content,
                type: postType || 'regular',
                timestamp: new Date(),
                likes: 0,
                image: null
            };

            if (postType === 'sale') {
                post.price = document.getElementById('priceInput').value || 0;
            } else if (postType === 'bid') {
                post.startingBid = document.getElementById('bidInput').value || 0;
                post.currentBid = post.startingBid;
                const hours = document.getElementById('hoursInput').value || 24;
                post.endTime = new Date(Date.now() + hours * 60 * 60 * 1000);
            }

            const fileInput = document.getElementById('imageUpload');
            if (fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    post.image = e.target.result;
                    posts.unshift(post);
                    resetForm();
                    loadFeed();
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                posts.unshift(post);
                resetForm();
                loadFeed();
            }
        }

        function resetForm() {
            document.getElementById('postContent').value = '';
            document.getElementById('imageUpload').value = '';
            document.getElementById('priceInput').value = '';
            document.getElementById('bidInput').value = '';
            postType = null;
            document.getElementById('saleBtn').classList.remove('active');
            document.getElementById('bidBtn').classList.remove('active');
            document.getElementById('priceSection').classList.add('hidden');
            document.getElementById('bidSection').classList.add('hidden');
        }

        function loadFeed() {
            const container = document.getElementById('feedContainer');
            container.innerHTML = posts.map(post => {
                const userLiked = likes.some(l => l.userId === currentUser.id && l.postId === post.id);
                const isFollowing = follows.some(f => f.followerId === currentUser.id && f.followingId === post.authorId);
                const postLikes = likes.filter(l => l.postId === post.id).length;

                let infoSection = '';
                if (post.type === 'sale') {
                    infoSection = `
                        <div class="post-info sale">
                            <h4>Price: $${post.price}</h4>
                            <button class="bid-btn" onclick="purchase(${post.id})">Purchase</button>
                        </div>
                    `;
                } else if (post.type === 'bid') {
                    const timeLeft = getTimeLeft(post.endTime);
                    infoSection = `
                        <div class="post-info bid">
                            <h4>Current Bid: $${post.currentBid}</h4>
                            <div style="color: #856404; font-weight: bold;">${timeLeft}</div>
                            <div class="bid-input">
                                <input type="number" id="bid-${post.id}" placeholder="Your bid" min="${parseFloat(post.currentBid) + 1}">
                                <button class="bid-btn" onclick="placeBid(${post.id})">Bid</button>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="post">
                        <div class="post-header">
                            <div class="author">
                                <div class="avatar">${post.authorName.charAt(0)}</div>
                                <div>
                                    <div class="author-name">${post.authorName}</div>
                                    <div class="time">${formatTime(post.timestamp)}</div>
                                </div>
                            </div>
                            ${post.authorId !== currentUser.id ? `
                                <button class="follow-btn" onclick="toggleFollow(${post.authorId})">
                                    ${isFollowing ? 'Following' : 'Follow'}
                                </button>
                            ` : ''}
                        </div>
                        
                        ${post.image ? `<img src="${post.image}" class="post-image">` : ''}
                        
                        <div class="post-content">${post.content}</div>
                        
                        ${infoSection}
                        
                        <div class="post-actions">
                            <button class="action-btn" onclick="toggleLike(${post.id})">
                                ${userLiked ? '❤️' : '🤍'} ${postLikes}
                            </button>
                            <button class="action-btn">💬 Comment</button>
                            <button class="action-btn">📤 Share</button>
                        </div>
                    </div>
                `;
            }).join('');

            // Update timers
            posts.forEach(post => {
                 if (feedUpdateTimer) {
                    clearTimeout(feedUpdateTimer);
                 }
                updateTimers();
             });
        }

        function updateTimers() {
            posts.forEach(post => {
                if (post.type === 'bid') {
                    const timerElement = document.getElementById(`timer-${post.id}`);
                    if (timerElement) {
                        timerElement.textContent = getTimeLeft(post.endTime);
                    }
                }
            });
            
            // Updates every 10 seconds instead of 1 second
            feedUpdateTimer = setTimeout(updateTimers, 10000);
        }

        function toggleLike(postId) {
            const index = likes.findIndex(l => l.userId === currentUser.id && l.postId === postId);
            if (index > -1) {
                likes.splice(index, 1);
            } else {
                likes.push({ userId: currentUser.id, postId: postId });
            }
            loadFeed();
        }

        function toggleFollow(userId) {
            const index = follows.findIndex(f => f.followerId === currentUser.id && f.followingId === userId);
            if (index > -1) {
                follows.splice(index, 1);
            } else {
                follows.push({ followerId: currentUser.id, followingId: userId });
            }
            loadFeed();
        }

        function placeBid(postId) {
            const post = posts.find(p => p.id === postId);
            const bidValue = parseFloat(document.getElementById(`bid-${postId}`).value);
            
            if (!bidValue || bidValue <= post.currentBid) {
                alert('Bid must be higher than current bid');
                return;
            }
            
            post.currentBid = bidValue;
            alert('Bid placed successfully!');
            loadFeed();
        }

        function purchase(postId) {
            const post = posts.find(p => p.id === postId);
            alert(`Purchase confirmed! Total: $${post.price}`);
        }

        function getTimeLeft(endTime) {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end - now;
            
            if (diff <= 0) return 'Auction ended';
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours}h ${minutes}m remaining`;
        }

        function formatTime(date) {
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            
            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
            return `${Math.floor(minutes / 1440)}d ago`;
        }