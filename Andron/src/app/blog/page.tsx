"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { getImagePath } from "@/utils/imagePath";

const blogPosts = [
  {
    id: 1,
    category: "Design",
    title: "UX review presentations",
    description:
      "How do you create compelling presentations that wow your colleagues and impress your managers?",
    imageUrl: getImagePath("/assets/images/blogs/UX review presentations.png"),
    author: {
      name: "Olivia Rhye",
      avatarUrl: getImagePath("/assets/images/avatar/Olivia Rhye.png"),
    },
    date: "20 Jan 2022",
  },
  {
    id: 2,
    category: "Product",
    title: "Migrating to Linear 101",
    description:
      "Linear helps streamline software projects, sprints, tasks, and bug tracking. Here&apos;s how to get started.",
    imageUrl: getImagePath("/assets/images/blogs/Migrating to Linear 101.png"),
    author: {
      name: "Phoenix Baker",
      avatarUrl: getImagePath("/assets/images/avatar/Phoenix Baker.png"),
    },
    date: "19 Jan 2022",
  },
  {
    id: 3,
    category: "Software Engineering",
    title: "Building your API Stack",
    description:
      "The rise of RESTful APIs has been met by a rise in tools for creating, testing, and managing them.",
    imageUrl: getImagePath("/assets/images/blogs/Building your API Stack.png"),
    author: {
      name: "Lana Steiner",
      avatarUrl: getImagePath("/assets/images/avatar/Lana Steiner.png"),
    },
    date: "18 Jan 2022",
  },
  // {
  //   id: 4,
  //   category: "Management",
  //   title: "Bill Walsh leadership lessons",
  //   description:
  //     "Like to know the secrets of transforming a 2-14 team into a 3x Super Bowl winning Dynasty?",
  //   imageUrl: getImagePath("/assets/images/blogs/Bill Walsh leadership lessons.png"),
  //   author: {
  //     name: "Alec Whitten",
  //     avatarUrl: getImagePath("/assets/images/avatar/Alec Whitten.png"),
  //   },
  //   date: "17 Jan 2022",
  // },
  // {
  //   id: 5,
  //   category: "Product",
  //   title: "PM mental models",
  //   description:
  //     "Mental models are simple expressions of complex processes or relationships.",
  //   imageUrl: getImagePath("/assets/images/blogs/PM mental models.png"),
  //   author: {
  //     name: "Demi Wilkinson",
  //     avatarUrl: getImagePath("/assets/images/avatar/Demi Wilkinson.png"),
  //   },
  //   date: "16 Jan 2022",
  // },
  // {
  //   id: 6,
  //   category: "Design",
  //   title: "What is Wireframing?",
  //   description:
  //     "Introduction to Wireframing and its Principles. Learn from the best in the industry.",
  //   imageUrl: getImagePath("/assets/images/blogs/What is Wireframing.png"),
  //   author: {
  //     name: "Candice Wu",
  //     avatarUrl: getImagePath("/assets/images/avatar/Candice Wu.png"),
  //   },
  //   date: "15 Jan 2022",
  // },
  // {
  //   id: 7,
  //   category: "Design",
  //   title: "How collaboration makes us better designers",
  //   description:
  //     "Collaboration can make our teams stronger, and our individual designs better.",
  //   imageUrl:
  //     getImagePath("/assets/images/blogs/How collaboration makes us better designers.png"),
  //   author: {
  //     name: "Natali Craig",
  //     avatarUrl: getImagePath("/assets/images/avatar/Natali Craig.png"),
  //   },
  //   date: "14 Jan 2022",
  // },
  // {
  //   id: 8,
  //   category: "Product",
  //   title: "Our top 10 Javascript frameworks to use",
  //   description:
  //     "JavaScript frameworks make development easy with extensive features and functionalities.",
  //   imageUrl:
  //     getImagePath("/assets/images/blogs/Our top 10 Javascript frameworks to use.png"),
  //   author: {
  //     name: "Drew Cano",
  //     avatarUrl: getImagePath("/assets/images/avatar/Drew Cano.png")  ,
  //   },
  //   date: "13 Jan 2022",
  // },
  // {
  //   id: 9,
  //   category: "Customer Success",
  //   title: "Podcast: Creating a better CX Community",
  //   description:
  //     "Starting a community doesn&apos;t need to be complicated, but how do you get started?",
  //   imageUrl:
  //     getImagePath("/assets/images/blogs/Podcast- Creating a better CX Community.png"),
  //   author: {
  //     name: "Orlando Diggs",
  //     avatarUrl: getImagePath("/assets/images/avatar/Orlando Diggs.png"),
  //   },
  //   date: "12 Jan 2022",
  // },
];

export default function BlogPage() {
  return (
    <main>
      <div className="relative h-[70px]"></div>

      <section className="py-20 bg-white text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-[24px] leading-[24px] font-bold text-[#000] mb-[10px]"
        >
          BLOG
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center mb-[113px] px-4 w-full"
        >
          <div className="relative w-full max-w-md mx-auto">
            {/* Search icon */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {/* Search input */}
            <input
              type="text"
              name="search"
              placeholder="Search"
              className="w-full !pl-12 pr-4 py-3 text-gray-600 placeholder-gray-400 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </motion.div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, idx) => {
            let initialAnim, whileAnim;
            if (idx % 3 === 1) {
              initialAnim = { opacity: 0, x: 60 };
              whileAnim = { opacity: 1, x: 0 };
            } else if (idx % 3 === 2) {
              initialAnim = { opacity: 0, x: -60 };
              whileAnim = { opacity: 1, x: 0 };
            } else {
              initialAnim = { opacity: 0, y: 40 };
              whileAnim = { opacity: 1, y: 0 };
            }
            return (
              <motion.div
                key={post.id}
                initial={initialAnim}
                whileInView={whileAnim}
                transition={{ duration: 0.6, delay: 0.1 * (idx + 1) }}
                viewport={{ once: true }}
                className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 px-6 pb-8 pt-6"
              >
                <div className="relative w-full h-48 mb-8">
                  <Image
                    src={getImagePath(post.imageUrl)}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#7B61FF] mb-2">
                    {post.category}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-extrabold text-[#222]">
                      {post.title}
                    </h3>
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-gray-400 hover:text-[#0099FF] transition"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center mt-4">
                    <Image
                      src={getImagePath(post.author.avatarUrl)}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#222]">
                        {post.author.name}
                      </p>
                      <p className="text-xs text-gray-500">{post.date}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
