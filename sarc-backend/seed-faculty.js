const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const facultyData = [
    {
        user: {
            fullName: 'Dr. Priya Ramanan',
            email: 'priya.ramanan@sathyabama.ac.in',
            password: 'faculty123',
            role: 'FACULTY',
        },
        profile: {
            department: 'Computer Science & Engineering',
            designation: 'Professor & Head of Department',
            researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Natural Language Processing'],
            skills: ['Python', 'TensorFlow', 'PyTorch', 'Deep Learning', 'Keras'],
            bio: 'Dr. Priya Ramanan is a distinguished Professor and Head of the CSE Department with over 18 years of experience in AI and Machine Learning research. She has published more than 60 papers in top-tier journals and conferences, and has guided over 30 doctoral students. Her work focuses on building intelligent systems that solve real-world problems in healthcare, agriculture, and education.',
            yearsOfExperience: 18,
            linkedin: 'https://linkedin.com/in/priya-ramanan',
        },
        projects: [
            {
                title: 'AI-Powered Early Disease Detection System',
                description: 'This project aims to build a deep learning model capable of detecting diseases like cancer, diabetes, and heart conditions from medical imaging data. The system will use CNNs for image classification and provide explainable AI outputs for doctors.',
                domain: 'Artificial Intelligence / Healthcare',
                skillsRequired: ['Python', 'Deep Learning', 'Medical Imaging', 'OpenCV'],
                technologies: ['TensorFlow', 'Keras', 'OpenCV', 'Flask', 'Docker'],
                numberOfStudents: 4,
                status: 'OPEN',
            },
            {
                title: 'Multilingual Sentiment Analysis for Social Media',
                description: 'Build an NLP model capable of understanding sentiment across multiple Indian languages (Tamil, Hindi, Telugu) from social media content. The project involves data collection, model training, and real-time classification.',
                domain: 'Natural Language Processing',
                skillsRequired: ['NLP', 'Python', 'Transformers', 'BERT'],
                technologies: ['HuggingFace', 'PyTorch', 'FastAPI', 'React'],
                numberOfStudents: 3,
                status: 'OPEN',
            }
        ]
    },
    {
        user: {
            fullName: 'Dr. Arjun Krishnaswamy',
            email: 'arjun.k@sathyabama.ac.in',
            password: 'faculty123',
            role: 'FACULTY',
        },
        profile: {
            department: 'Electronics & Communication Engineering',
            designation: 'Associate Professor',
            researchAreas: ['Internet of Things', 'Wireless Communication', 'Embedded Systems', 'Smart Grids'],
            skills: ['Arduino', 'Raspberry Pi', 'MATLAB', 'VHDL', 'C/C++', 'LoRa'],
            bio: 'Dr. Arjun Krishnaswamy is an Associate Professor with 12 years of experience in IoT, embedded systems, and wireless communication. He has led several government-funded research projects and has strong industry collaborations with ISRO and DRDO. His current focus is on building low-cost, energy-efficient IoT solutions for smart cities and agriculture.',
            yearsOfExperience: 12,
            linkedin: 'https://linkedin.com/in/arjun-k-ece',
        },
        projects: [
            {
                title: 'Smart Agriculture IoT System with Edge Computing',
                description: 'Develop an IoT system that monitors soil health, weather, and crop conditions in real-time using edge computing nodes. The system will provide alerts and recommendations to farmers via a mobile application.',
                domain: 'Internet of Things / Smart Agriculture',
                skillsRequired: ['IoT', 'Embedded C', 'Node.js', 'React Native'],
                technologies: ['ESP32', 'MQTT', 'Node-RED', 'AWS IoT', 'React Native'],
                numberOfStudents: 5,
                status: 'OPEN',
            }
        ]
    },
    {
        user: {
            fullName: 'Dr. Meenakshi Subramaniam',
            email: 'meenakshi.s@sathyabama.ac.in',
            password: 'faculty123',
            role: 'FACULTY',
        },
        profile: {
            department: 'Information Technology',
            designation: 'Assistant Professor',
            researchAreas: ['Blockchain Technology', 'Cybersecurity', 'Cloud Computing', 'Data Privacy'],
            skills: ['Solidity', 'Ethereum', 'Python', 'AWS', 'Penetration Testing', 'Cryptography'],
            bio: 'Dr. Meenakshi Subramaniam is a passionate researcher in Blockchain and Cybersecurity with 8 years of academic and industry experience. She has consulted for fintech startups on building secure, decentralized systems and regularly speaks at national conferences on data privacy and cyber threats.',
            yearsOfExperience: 8,
            linkedin: 'https://linkedin.com/in/meenakshi-subramaniam',
        },
        projects: [
            {
                title: 'Decentralized Student Credential Verification on Blockchain',
                description: 'Build a blockchain-based system to issue and verify student academic credentials (degrees, certificates) without relying on a central authority. This will eliminate fake certificates and simplify the verification process for employers.',
                domain: 'Blockchain / Education Technology',
                skillsRequired: ['Solidity', 'Web3.js', 'React', 'Ethereum'],
                technologies: ['Ethereum', 'Solidity', 'IPFS', 'React', 'MetaMask'],
                numberOfStudents: 3,
                status: 'OPEN',
            },
            {
                title: 'AI-Based Network Intrusion Detection System',
                description: 'Design a machine learning system that continuously monitors network traffic and detects malicious activity in real-time. The system will be trained on standard cybersecurity datasets and integrated with existing network infrastructure.',
                domain: 'Cybersecurity / Machine Learning',
                skillsRequired: ['Python', 'Machine Learning', 'Network Security', 'Wireshark'],
                technologies: ['Python', 'Scikit-learn', 'Snort', 'ELK Stack'],
                numberOfStudents: 4,
                status: 'OPEN',
            }
        ]
    },
    {
        user: {
            fullName: 'Dr. Venkatesh Iyer',
            email: 'venkatesh.iyer@sathyabama.ac.in',
            password: 'faculty123',
            role: 'FACULTY',
        },
        profile: {
            department: 'Mechanical Engineering',
            designation: 'Professor',
            researchAreas: ['Robotics & Automation', 'Computer Vision', '3D Printing', 'Manufacturing Technology'],
            skills: ['ROS', 'OpenCV', 'SolidWorks', 'MATLAB', 'Python', 'CAD/CAM'],
            bio: 'Dr. Venkatesh Iyer brings 20 years of expertise in robotics, computer vision, and advanced manufacturing. He leads the Robotics & Automation Lab at Sathyabama and has guided numerous industry-sponsored projects with companies like Bosch and Tata Technologies. His research focuses on integrating AI with mechanical systems for autonomous manufacturing.',
            yearsOfExperience: 20,
            linkedin: 'https://linkedin.com/in/venkatesh-iyer-robotics',
        },
        projects: [
            {
                title: 'Autonomous Robotic Arm for Industrial Assembly',
                description: 'Design and build a robotic arm that can autonomously identify, pick, and place components on an assembly line using computer vision. The system will use ROS for robot control and deep learning for object detection.',
                domain: 'Robotics / Computer Vision',
                skillsRequired: ['ROS', 'Python', 'OpenCV', 'Deep Learning', 'C++'],
                technologies: ['ROS2', 'OpenCV', 'YOLO', 'Arduino', 'Python'],
                numberOfStudents: 5,
                status: 'OPEN',
            }
        ]
    },
    {
        user: {
            fullName: 'Dr. Kavitha Nair',
            email: 'kavitha.nair@sathyabama.ac.in',
            password: 'faculty123',
            role: 'FACULTY',
        },
        profile: {
            department: 'Biotechnology',
            designation: 'Associate Professor',
            researchAreas: ['Bioinformatics', 'Computational Biology', 'Genomics', 'Drug Discovery'],
            skills: ['Python', 'R', 'BLAST', 'BioPython', 'Machine Learning', 'Statistical Analysis'],
            bio: 'Dr. Kavitha Nair is a leading researcher at the intersection of biology and computation. With 10 years of experience in bioinformatics and genomics, she has contributed to several breakthrough studies on gene expression analysis and drug-target interaction prediction. She strongly encourages interdisciplinary research and welcomes students from CS, ECE, and IT backgrounds.',
            yearsOfExperience: 10,
            linkedin: 'https://linkedin.com/in/kavitha-nair-bioinfo',
        },
        projects: [
            {
                title: 'ML-Based Drug-Target Interaction Prediction',
                description: 'Use machine learning and graph neural networks to predict how drug molecules interact with specific protein targets. This research will help accelerate the drug discovery pipeline and reduce experimental costs.',
                domain: 'Bioinformatics / Machine Learning',
                skillsRequired: ['Python', 'Machine Learning', 'Graph Neural Networks', 'Biochemistry Basics'],
                technologies: ['Python', 'PyTorch Geometric', 'RDKit', 'BioPython', 'Jupyter'],
                numberOfStudents: 3,
                status: 'OPEN',
            }
        ]
    }
];

async function seedFaculty() {
    console.log('🌱 Starting faculty seeding...\n');
    const salt = await bcrypt.genSalt(10);

    for (const data of facultyData) {
        try {
            // Check if user already exists
            const existing = await prisma.user.findUnique({ where: { email: data.user.email } });
            if (existing) {
                console.log(`⚠️  Skipping ${data.user.fullName} — already exists.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(data.user.password, salt);

            // Create user
            const user = await prisma.user.create({
                data: {
                    fullName: data.user.fullName,
                    email: data.user.email,
                    password: hashedPassword,
                    role: 'FACULTY',
                }
            });

            // Create faculty profile
            const profile = await prisma.facultyProfile.create({
                data: {
                    userId: user.id,
                    department: data.profile.department,
                    designation: data.profile.designation,
                    researchAreas: data.profile.researchAreas,
                    skills: data.profile.skills,
                    bio: data.profile.bio,
                    yearsOfExperience: data.profile.yearsOfExperience,
                    linkedin: data.profile.linkedin,
                }
            });

            // Create projects
            for (const proj of data.projects) {
                await prisma.project.create({
                    data: {
                        title: proj.title,
                        description: proj.description,
                        domain: proj.domain,
                        skillsRequired: proj.skillsRequired,
                        technologies: proj.technologies,
                        numberOfStudents: proj.numberOfStudents,
                        status: proj.status,
                        facultyId: profile.id,
                    }
                });
            }

            console.log(`✅ Created: ${data.user.fullName} (${data.profile.department}) with ${data.projects.length} project(s)`);
        } catch (err) {
            console.error(`❌ Error seeding ${data.user.fullName}:`, err.message);
        }
    }

    console.log('\n🎉 Faculty seeding complete!');
    await prisma.$disconnect();
}

seedFaculty();
