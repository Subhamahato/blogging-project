            document.addEventListener('DOMContentLoaded', () => {
            // --- Hamburger Menu Logic ---
            const hamburgerButton = document.querySelector('.hamburger-button');
            const mainNavUl = document.getElementById('main-nav').querySelector('ul');

            hamburgerButton.addEventListener('click', () => {
                hamburgerButton.classList.toggle('active');
                mainNavUl.classList.toggle('active');
            });

            // Close menu when a navigation link is clicked
            mainNavUl.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 767 && mainNavUl.classList.contains('active')) {
                        hamburgerButton.classList.remove('active');
                        mainNavUl.classList.remove('active');
                    }
                });
            });

            // Close menu if browser window is resized to a larger size
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (window.innerWidth > 767) {
                        hamburgerButton.classList.remove('active');
                        mainNavUl.classList.remove('active');
                    }
                }, 250); // Debounce resize event
            });

            // --- DOCX Loading and Theme Toggle Logic ---
            const SUN_PNG_URL = "assets/images/toggle-images/sun.png";
            const MOON_PNG_URL = "assets/images/toggle-images/moon.png";

            let sunPngLoaded = false;
            let moonPngLoaded = false;
            let isAnimating = false;

            const blogContent = document.getElementById("blog-content");
            const relatedPostsGrid = document.getElementById('relatedPostsGrid');
            const noRelatedPostsMessage = document.getElementById('noRelatedPostsMessage');

            async function loadDocx(docFileName) {
                const docxUrl = docFileName;
                try {
                    const response = await fetch(docxUrl);
                    if (!response.ok) {
                        // If the specific docx file isn't found, try loading the default page_not_found.docx
                        if (docFileName !== "assets/document-contents/page_not_found.docx") {
                            console.warn(`DOCX file not found: ${docxUrl}. Attempting to load page_not_found.docx`);
                            await loadDocx("assets/document-contents/page_not_found.docx"); // Recursive call for fallback
                            return; // Exit to prevent further processing for this call
                        }
                        throw new Error(`HTTP error! status: ${response.status} for ${docxUrl}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });

                    blogContent.innerHTML = result.value;
                    // Optional: Update page title based on DOCX content (e.g., first heading)
                    const firstHeading = blogContent.querySelector('h1, h2, h3');
                    if (firstHeading) {
                        document.title = `Subham's Blog - ${firstHeading.textContent}`;
                    } else {
                        document.title = `Subham's Blog - ${docFileName.replace('.docx', '')}`;
                    }

                } catch (err) {
                    blogContent.innerHTML = `<p style='color:red;'>Failed to load blog content. Ensure your internet connection is good.</p>`; // failed msg file path
                    document.title = "Subham's Blog - Error";
                    console.error("Error loading DOCX:", err);
                }
            }

            async function loadPostsData() {
                try {
                    const response = await fetch('assets/json/posts-data.json');
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('Error loading posts-data.json:', error);
                    return []; // Return empty array on error
                }
            }

            function getDocFileNameFromUrl() {
                const params = new URLSearchParams(window.location.search);
                // Default to 'home.docx' if 'doc' parameter is not present
                return params.get('doc') ? `${params.get('doc')}.docx` : 'assets/document-contents/home.docx';
            }

            async function populateRelatedPosts() {
                const currentDocFileName = getDocFileNameFromUrl();
                const posts = await loadPostsData();
                relatedPostsGrid.innerHTML = ''; // Clear existing content

                const filteredPosts = posts.filter(post => post.fileName !== currentDocFileName);

                if (filteredPosts.length === 0) {
                    noRelatedPostsMessage.style.display = 'block';
                    return;
                } else {
                    noRelatedPostsMessage.style.display = 'none';
                }

                filteredPosts.forEach(post => {
                    const postItem = document.createElement('a');
                    postItem.href = `index.html?doc=${post.fileName.replace('.docx', '')}`;
                    postItem.classList.add('related-post-item');

                    const img = document.createElement('img'); // Assign the thumbnail from JSON first
                    img.src = post.thumbnail; // This is the potentially valid but broken link
                    img.alt = `${post.title} Thumbnail`;
                    
                    // --- THIS IS THE KEY PART FOR FALLBACK (if image fails to load) ---
                    img.onerror = function() {
                        this.onerror = null; // Prevent infinite loop if fallback itself is broken
                        this.src = 'assets/images/thumbnail-images/default_thumbnail.png'; // Your fallback image path
                    };
                    // --- END OF KEY PART ---

                    const postInfo = document.createElement('div');
                    postInfo.classList.add('post-info');

                    const title = document.createElement('h4');
                    title.textContent = post.title;

                    const description = document.createElement('p');
                    description.textContent = post.description;

                    postInfo.appendChild(title);
                    postInfo.appendChild(description);
                    postItem.appendChild(img);
                    postItem.appendChild(postInfo);

                    relatedPostsGrid.appendChild(postItem);
                });
            }

            // Function to load PNGs and set flags
            function loadPngs() {
                const sunPng = document.getElementById('sunPng');
                const moonPng = document.getElementById('moonPng');

                sunPng.onload = () => { sunPngLoaded = true; updateActiveIconVisibility(); };
                sunPng.onerror = () => { console.warn("Failed to load sun.png. Falling back to SVG."); sunPngLoaded = false; updateActiveIconVisibility(); };
                sunPng.src = SUN_PNG_URL;

                moonPng.onload = () => { moonPngLoaded = true; updateActiveIconVisibility(); };
                moonPng.onerror = () => { console.warn("Failed to load moon.png. Falling back to SVG."); moonPngLoaded = false; updateActiveIconVisibility(); };
                moonPng.src = MOON_PNG_URL;
            }

            // Function to ensure only the correct icon (PNG or SVG) is visible
            function updateActiveIconVisibility() {
                const body = document.body;
                const sunPng = document.getElementById('sunPng');
                const moonPng = document.getElementById('moonPng');
                const sunSvg = document.getElementById('sunSvg');
                const moonSvg = document.getElementById('moonSvg');

                sunPng.classList.remove('active');
                sunSvg.classList.remove('active');
                moonPng.classList.remove('active');
                moonSvg.classList.remove('active');

                if (body.classList.contains("night")) {
                    if (moonPngLoaded) {
                        moonPng.classList.add('active');
                    } else {
                        moonSvg.classList.add('active');
                    }
                } else {
                    if (sunPngLoaded) {
                        sunPng.classList.add('active');
                    } else {
                        sunSvg.classList.add('active');
                    }
                }
            }

            // Initial calls
            const currentDoc = getDocFileNameFromUrl();
            loadDocx(currentDoc);
            populateRelatedPosts();
            loadPngs();

            const themeToggle = document.getElementById("themeToggle");
            const body = document.body;
            const sunPng = document.getElementById('sunPng');
            const moonPng = document.getElementById('moonPng');
            const sunSvg = document.getElementById('sunSvg');
            const moonSvg = document.getElementById('moonSvg');

            const themeToggleDialog = document.getElementById('themeToggleDialog');
            const dialogTitle = document.getElementById('dialogTitle');
            const dialogMessage = document.getElementById('dialogMessage');
            const dialogOkButton = document.getElementById('dialogOkButton');

            // Calculate and set CSS variable for animation distance
            function setAnimationDistance() {
                const viewportWidth = window.innerWidth;
                const toggleWidth = themeToggle.offsetWidth; // 60px
                const margin = 20; // 20px from edge

                const distance = viewportWidth - (2 * margin) - toggleWidth;
                document.documentElement.style.setProperty('--animation-x-distance', `${distance}px`);
            }

            setAnimationDistance();
            window.addEventListener('resize', setAnimationDistance);

            // Load saved theme from localStorage for initial display
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "night") {
                body.classList.add("night");
                themeToggle.style.right = '20px';
                themeToggle.style.left = 'auto';
            } else {
                themeToggle.style.left = '20px';
                themeToggle.style.right = 'auto';
            }
            updateActiveIconVisibility();

            // Set dialogue box content based on the initial theme
            const isNightInitially = body.classList.contains("night");
            if (isNightInitially) {
                dialogTitle.textContent = "Night Mode Activated!";
                dialogMessage.textContent = "Click the Moon to change the theme back to Day.";
            } else {
                dialogTitle.textContent = "Day Mode Activated!";
                dialogMessage.textContent = "Click the Sun to change the theme to Night.";
            }
            themeToggleDialog.classList.add('show'); // Always show the dialog on load

            dialogOkButton.addEventListener('click', () => {
                themeToggleDialog.classList.remove('show');
            });

            function toggleTheme() {
                if (isAnimating) return;
                isAnimating = true;

                const isNight = body.classList.contains("night");

                if (isNight) {
                    themeToggle.classList.add('moving-to-day');
                } else {
                    themeToggle.classList.add('moving-to-night');
                }

                setTimeout(() => {
                    // At the midpoint, instantly switch icons and toggle theme
                    sunPng.classList.remove('active');
                    sunSvg.classList.remove('active');
                    moonPng.classList.remove('active');
                    moonSvg.classList.remove('active');

                    body.classList.toggle("night"); // Toggle body class immediately at midpoint
                    localStorage.setItem("theme", body.classList.contains("night") ? "night" : "day");

                    updateActiveIconVisibility(); // Update icon state after theme change
                }, 750); // Half of the 1.5s animation duration

                setTimeout(() => {
                    themeToggle.classList.remove('moving-to-night', 'moving-to-day');

                    // Directly set the final position after animation completes
                    if (body.classList.contains("night")) {
                        themeToggle.style.right = '20px';
                        themeToggle.style.left = 'auto';
                    } else {
                        themeToggle.style.left = '20px';
                        themeToggle.style.right = 'auto';
                    }
                    isAnimating = false;
                }, 1500);
            }

            themeToggle.addEventListener("click", toggleTheme);
            themeToggle.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTheme();
                }
            });
        });
        
        